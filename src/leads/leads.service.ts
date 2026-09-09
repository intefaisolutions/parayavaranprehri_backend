import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  normalizeEmail,
  normalizeMobile,
} from '../common/utils/identity.util';
import { CrmSettingsService } from '../crm-settings/crm-settings.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import {
  CrmLeadsQueryOptions,
  CrmLeadStats,
  LeadRepository,
} from './repositories/lead.repository';
import {
  CrmSettingsSnapshot,
  CrmSyncStatus,
  LeadCrmSyncAudit,
  LeadDocument,
} from './schemas/lead.schema';

export interface LeadSubmissionResult {
  success: boolean;
  message: string;
  crmSubmitted: boolean;
  lead: LeadDocument;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly configService: ConfigService,
    private readonly crmSettingsService: CrmSettingsService,
  ) {}

  /**
   * Masks an API key for safe debugging display (e.g. iai_pk_live_...7d58)
   */
  private maskApiKey(key?: string | null): string {
    if (!key) return '';
    if (key.length <= 10) return '***';
    return `${key.slice(0, 12)}...${key.slice(-6)}`;
  }

  /**
   * Formats an Indian mobile number to E.164 (+91XXXXXXXXXX) for standard CRM format.
   */
  private formatPhoneE164(mobile: string): string {
    const digits = mobile.replace(/\D/g, '').slice(-10);
    return `+91${digits}`;
  }

  /**
   * Forward lead to IntefAI CRM Ingest API: POST /v1/ingest/lead
   */
  private async dispatchToCrm(params: {
    name: string;
    mobile: string;
    email?: string;
    source?: string;
    message?: string;
    syncType?: string;
    apiUrl?: string;
    apiKey?: string;
    location?: CreateLeadDto['location'];
    customData?: Record<string, unknown>;
  }): Promise<{
    ok: boolean;
    leadId?: string;
    crmLeadMongoId?: string;
    httpStatus?: number;
    response?: Record<string, unknown>;
    error?: string;
    sanitizedRequest: Record<string, unknown>;
  }> {
    const rawApiUrl =
      params.apiUrl ||
      this.configService.get<string>('CRM_API_URL') ||
      'https://crm.intefai.com/api';
    const baseUrl = rawApiUrl.replace(/\/+$/, '');
    const endpoint = baseUrl.endsWith('/v1/ingest/lead')
      ? baseUrl
      : `${baseUrl}/v1/ingest/lead`;

    const apiKey =
      params.apiKey ||
      this.configService.get<string>('CRM_API_KEY') ||
      'iai_pk_live_c00d50d8f3c1fbbf0c287d58';

    const formattedPhone = this.formatPhoneE164(params.mobile);
    const platformSource = params.source || 'Paryavaran Prahri Mobile App';

    const defaultMsg =
      params.syncType === 'registration'
        ? 'New User Registration'
        : 'Insurance Quote Request';

    const leadPayload: Record<string, unknown> = {
      name: params.name,
      phone: formattedPhone,
      platformSource,
      message: params.message || defaultMsg,
      customData: {
        app: 'Paryavaran Prahri',
        module: 'Lead Management',
        syncType: params.syncType || 'enquiry',
        registrationTimestamp: new Date().toISOString(),
        ...(params.customData || {}),
      },
    };

    if (params.email) {
      leadPayload.email = params.email;
    }

    if (params.location) {
      leadPayload.location = {
        city: params.location.city || '',
        state: params.location.state || '',
        country: params.location.country || 'India',
        latitude: params.location.latitude ?? null,
        longitude: params.location.longitude ?? null,
      };
    }

    const sanitizedRequest: Record<string, unknown> = {
      endpoint,
      method: 'POST',
      headers: {
        'x-api-key': this.maskApiKey(apiKey),
        'Content-Type': 'application/json',
      },
      payload: leadPayload,
    };

    this.logger.log(
      `Forwarding lead to IntefAI CRM Ingest API at ${endpoint} (Source: ${platformSource}, Phone: ${formattedPhone})`,
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
        body: JSON.stringify(leadPayload),
        signal: AbortSignal.timeout(10000),
      });

      const data = (await response.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (response.ok && data?.success === true) {
        const leadId = typeof data.leadId === 'string' ? data.leadId : undefined;
        const crmLeadMongoId =
          typeof data.id === 'string' ? data.id : undefined;

        this.logger.log(
          `IntefAI CRM Ingest Success for lead "${params.name}" (${formattedPhone}) -> LeadID: ${
            leadId || 'N/A'
          }`,
        );

        return {
          ok: true,
          leadId,
          crmLeadMongoId,
          httpStatus: response.status,
          response: data || { success: true },
          sanitizedRequest,
        };
      }

      const errorMessage =
        (typeof data?.message === 'string'
          ? data.message
          : Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.error) || `HTTP ${response.status} ${response.statusText}`;

      this.logger.warn(
        `IntefAI CRM Ingest failed for lead (${formattedPhone}): ${errorMessage}`,
      );

      return {
        ok: false,
        httpStatus: response.status,
        response: data || undefined,
        error: String(errorMessage),
        sanitizedRequest,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `IntefAI CRM network error for lead (${formattedPhone}): ${errorMessage}`,
      );
      return {
        ok: false,
        httpStatus: 0,
        error: errorMessage,
        sanitizedRequest,
      };
    }
  }

  /**
   * Helper to normalize lead document so legacy leads without crmSync have consistent audit fields
   */
  private normalizeLeadAudit(lead: LeadDocument): LeadDocument {
    if (!lead) return lead;

    const legacy = lead.crm || ({} as any);
    const audit = lead.crmSync || ({} as any);

    // If already has explicit audit decision/id, keep it
    if (audit.crmLeadId || (audit.status === 'SKIPPED' && audit.reason)) {
      return lead;
    }

    let status: CrmSyncStatus = audit.status || 'PENDING';
    let reason: string | null = audit.reason || null;
    let error: string | null = audit.error || null;

    if (legacy.submitted === true || legacy.leadId) {
      status = 'SYNCED';
    } else if (legacy.error && legacy.error.includes('SKIPPED')) {
      status = 'SKIPPED';
      reason = legacy.error.replace(/^CRM Sync SKIPPED:\s*/i, '');
    } else if (legacy.error) {
      status = 'FAILED';
      error = legacy.error;
    }

    lead.crmSync = {
      attempted: legacy.attempts > 0 || status === 'SYNCED',
      status,
      companyId: audit.companyId || legacy.companyId || '6a7c5eac4e89ab60b7c96017',
      companyName: audit.companyName || 'Insurance Company',
      crmLeadId: audit.crmLeadId || legacy.leadId || null,
      crmLeadMongoId: audit.crmLeadMongoId || legacy.crmLeadMongoId || null,
      reason: reason || (status === 'SKIPPED' ? 'Sync disabled in settings' : null),
      error: error || (status === 'FAILED' ? legacy.error || 'Submission failed' : null),
      httpStatus: audit.httpStatus ?? (status === 'SYNCED' ? 200 : null),
      attemptedAt: audit.attemptedAt || legacy.submittedAt || null,
      completedAt: audit.completedAt || (legacy.submitted ? legacy.submittedAt : null),
      settingsSnapshot: audit.settingsSnapshot || {
        masterAutoSyncAtDecision: status !== 'SKIPPED' || !legacy.error?.includes('Master Auto Sync'),
        syncUserRegistrationsAtDecision: status !== 'SKIPPED' || !legacy.error?.includes('New User Registrations'),
        syncEnquiriesAtDecision: status !== 'SKIPPED' || !legacy.error?.includes('Insurance Quote Enquiries'),
      },
      sanitizedRequest: audit.sanitizedRequest || null,
      sanitizedResponse: audit.sanitizedResponse || legacy.response || null,
      crmEndpoint: audit.crmEndpoint || 'https://crm.intefai.com/api/v1/ingest/lead',
    };

    return lead;
  }

  /**
   * Public lead creation flow:
   * 1. Validate & sanitize input
   * 2. Always save/update in Paryavaran MongoDB first
   * 3. Record snapshot of Admin CRM Settings at decision time
   * 4. Forward to IntefAI CRM Ingest API only when permitted
   * 5. Record full crmSync audit & legacy crm compatibility in MongoDB
   */
  async createLead(dto: CreateLeadDto): Promise<LeadSubmissionResult> {
    const name = dto.name.trim();
    const mobile = normalizeMobile(dto.mobile);
    const email = normalizeEmail(dto.email);
    const source = dto.source?.trim() || 'Paryavaran Prahri Mobile App';
    const syncType = (
      dto.syncType ||
      dto.type ||
      'enquiry'
    ).toLowerCase();

    if (!mobile || mobile.length !== 10) {
      throw new BadRequestException(
        'A valid 10-digit mobile number is required',
      );
    }

    this.logger.log(
      `Incoming lead request: name="${name}", mobile="${mobile}", email="${email || 'N/A'}", syncType="${syncType}"`,
    );

    // 1. Fetch current Admin CRM Settings
    const settings = await this.crmSettingsService.getSettings();
    const companyId = settings.crmCompanyId || '6a7c5eac4e89ab60b7c96017';
    const companyName = 'Insurance Company';

    // 2. Take historical snapshot of settings at decision time
    const settingsSnapshot: CrmSettingsSnapshot = {
      masterAutoSyncAtDecision: settings.crmSyncEnabled ?? true,
      syncUserRegistrationsAtDecision: settings.syncUserRegistrations ?? true,
      syncEnquiriesAtDecision: settings.syncEnquiries ?? true,
    };

    // 3. Evaluate whether CRM sync is allowed
    let shouldSyncToCrm = true;
    let skipReason = '';

    if (settings.crmSyncEnabled === false) {
      shouldSyncToCrm = false;
      skipReason = 'Master Auto Sync is disabled';
    } else if (
      syncType === 'registration' &&
      settings.syncUserRegistrations === false
    ) {
      shouldSyncToCrm = false;
      skipReason = 'New User Registrations sync is disabled';
    } else if (
      (syncType === 'enquiry' || syncType === 'quote') &&
      settings.syncEnquiries === false
    ) {
      shouldSyncToCrm = false;
      skipReason = 'Insurance Quote Enquiries sync is disabled';
    }

    // 4. Check duplicate lead by mobile
    const existing = await this.leadRepository.findByMobile(mobile);

    if (existing) {
      this.logger.log(
        `Existing lead found for mobile "${mobile}" (Lead ID: ${existing._id}, CRM leadId: ${existing.crm?.leadId || existing.crmSync?.crmLeadId || 'none'})`,
      );

      // If already successfully submitted to CRM, do not create duplicate in CRM
      if (existing.crm?.submitted || existing.crmSync?.status === 'SYNCED') {
        return {
          success: true,
          message: 'Lead already submitted and synced with IntefAI CRM',
          crmSubmitted: true,
          lead: this.normalizeLeadAudit(existing),
        };
      }

      // If CRM sync is disabled, update Mongo with SKIPPED audit
      if (!shouldSyncToCrm) {
        const skippedAudit: LeadCrmSyncAudit = {
          attempted: false,
          status: 'SKIPPED',
          companyId,
          companyName,
          crmLeadId: null,
          crmLeadMongoId: null,
          reason: skipReason,
          error: null,
          httpStatus: null,
          attemptedAt: null,
          completedAt: null,
          settingsSnapshot,
          sanitizedRequest: null,
          sanitizedResponse: null,
          crmEndpoint: 'https://crm.intefai.com/api/v1/ingest/lead',
        };

        const updated = (await this.leadRepository.updateById(
          String(existing._id),
          {
            name,
            email,
            source,
            syncType,
            crmSync: skippedAudit,
            'crm.companyId': companyId,
            'crm.submitted': false,
            'crm.error': `CRM Sync SKIPPED: ${skipReason}`,
          },
        )) as LeadDocument;

        return {
          success: true,
          message: `Lead saved in MongoDB (${skipReason})`,
          crmSubmitted: false,
          lead: this.normalizeLeadAudit(updated ?? existing),
        };
      }

      // Dispatch to CRM
      const crmResult = await this.dispatchToCrm({
        name,
        mobile,
        email,
        source,
        message: dto.message,
        syncType,
        apiUrl: settings.crmApiUrl,
        apiKey: settings.crmApiKey,
        location: dto.location,
        customData: dto.customData,
      });

      const auditData: LeadCrmSyncAudit = {
        attempted: true,
        status: crmResult.ok ? 'SYNCED' : 'FAILED',
        companyId,
        companyName,
        crmLeadId: crmResult.leadId ?? existing.crmSync?.crmLeadId ?? null,
        crmLeadMongoId:
          crmResult.crmLeadMongoId ?? existing.crmSync?.crmLeadMongoId ?? null,
        reason: crmResult.ok ? null : crmResult.error ?? 'CRM submission failed',
        error: crmResult.ok ? null : crmResult.error ?? null,
        httpStatus: crmResult.httpStatus ?? (crmResult.ok ? 200 : 400),
        attemptedAt: new Date(),
        completedAt: crmResult.ok ? new Date() : null,
        settingsSnapshot,
        sanitizedRequest: crmResult.sanitizedRequest,
        sanitizedResponse: crmResult.response ?? null,
        crmEndpoint: 'https://crm.intefai.com/api/v1/ingest/lead',
      };

      const updated = (await this.leadRepository.updateById(
        String(existing._id),
        {
          name,
          email,
          source,
          syncType,
          crmSync: auditData,
          'crm.companyId': companyId,
          'crm.leadId': crmResult.leadId ?? existing.crm?.leadId ?? null,
          'crm.crmLeadMongoId':
            crmResult.crmLeadMongoId ?? existing.crm?.crmLeadMongoId ?? null,
          'crm.submitted': crmResult.ok,
          'crm.response': crmResult.response ?? null,
          'crm.error': crmResult.error ?? null,
          'crm.submittedAt': crmResult.ok
            ? new Date()
            : existing.crm?.submittedAt ?? null,
          $inc: { 'crm.attempts': 1 },
        },
      )) as LeadDocument;

      return {
        success: true,
        message: crmResult.ok
          ? 'Lead submitted and synced with IntefAI CRM successfully'
          : 'Lead updated in MongoDB, but CRM sync failed and can be retried',
        crmSubmitted: crmResult.ok,
        lead: this.normalizeLeadAudit(updated ?? existing),
      };
    }

    // 5. Create new lead in MongoDB
    const initialAudit: LeadCrmSyncAudit = {
      attempted: false,
      status: shouldSyncToCrm ? 'PENDING' : 'SKIPPED',
      companyId,
      companyName,
      crmLeadId: null,
      crmLeadMongoId: null,
      reason: shouldSyncToCrm ? null : skipReason,
      error: null,
      httpStatus: null,
      attemptedAt: null,
      completedAt: null,
      settingsSnapshot,
      sanitizedRequest: null,
      sanitizedResponse: null,
      crmEndpoint: 'https://crm.intefai.com/api/v1/ingest/lead',
    };

    const newLead = await this.leadRepository.create({
      name,
      mobile,
      email,
      source,
      syncType,
      crmSync: initialAudit,
      crm: {
        companyId,
        leadId: null,
        crmLeadMongoId: null,
        submitted: false,
        response: null,
        error: shouldSyncToCrm ? null : `CRM Sync SKIPPED: ${skipReason}`,
        submittedAt: null,
        attempts: 0,
      },
    } as Partial<LeadDocument>);

    this.logger.log(
      `Saved lead in Paryavaran MongoDB with ID: ${newLead._id} (Status: ${initialAudit.status})`,
    );

    // If CRM sync is disabled by settings, return immediately
    if (!shouldSyncToCrm) {
      return {
        success: true,
        message: `Lead saved in MongoDB (${skipReason})`,
        crmSubmitted: false,
        lead: this.normalizeLeadAudit(newLead),
      };
    }

    // 6. CRM sync enabled: Dispatch to IntefAI CRM Ingest API
    const crmResult = await this.dispatchToCrm({
      name,
      mobile,
      email,
      source,
      message: dto.message,
      syncType,
      apiUrl: settings.crmApiUrl,
      apiKey: settings.crmApiKey,
      location: dto.location,
      customData: dto.customData,
    });

    const finalAudit: LeadCrmSyncAudit = {
      attempted: true,
      status: crmResult.ok ? 'SYNCED' : 'FAILED',
      companyId,
      companyName,
      crmLeadId: crmResult.leadId ?? null,
      crmLeadMongoId: crmResult.crmLeadMongoId ?? null,
      reason: crmResult.ok ? null : crmResult.error ?? 'CRM submission failed',
      error: crmResult.ok ? null : crmResult.error ?? null,
      httpStatus: crmResult.httpStatus ?? (crmResult.ok ? 200 : 400),
      attemptedAt: new Date(),
      completedAt: crmResult.ok ? new Date() : null,
      settingsSnapshot,
      sanitizedRequest: crmResult.sanitizedRequest,
      sanitizedResponse: crmResult.response ?? null,
      crmEndpoint: 'https://crm.intefai.com/api/v1/ingest/lead',
    };

    const updatedLead = (await this.leadRepository.updateById(
      String(newLead._id),
      {
        crmSync: finalAudit,
        'crm.companyId': companyId,
        'crm.leadId': crmResult.leadId ?? null,
        'crm.crmLeadMongoId': crmResult.crmLeadMongoId ?? null,
        'crm.submitted': crmResult.ok,
        'crm.response': crmResult.response ?? null,
        'crm.error': crmResult.error ?? null,
        'crm.submittedAt': crmResult.ok ? new Date() : null,
        'crm.attempts': 1,
      },
    )) as LeadDocument;

    return {
      success: true,
      message: crmResult.ok
        ? 'Lead created and synced with IntefAI CRM successfully'
        : 'Lead saved in MongoDB, but CRM sync failed and can be retried',
      crmSubmitted: crmResult.ok,
      lead: this.normalizeLeadAudit(updatedLead ?? newLead),
    };
  }

  /**
   * Retry CRM synchronization for a lead:
   * 1. Check if already SYNCED (prevent duplicate CRM leads)
   * 2. Re-check current Admin CRM Settings
   * 3. Send only if currently allowed
   * 4. Update CRM audit fields & timestamps
   */
  async retryLead(id: string): Promise<LeadSubmissionResult> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    // 1. Prevent duplicate sync if lead is already synced
    if (lead.crmSync?.status === 'SYNCED' || lead.crm?.submitted === true) {
      return {
        success: true,
        message: 'Lead is already synced with IntefAI CRM (Duplicate sync prevented)',
        crmSubmitted: true,
        lead: this.normalizeLeadAudit(lead),
      };
    }

    // 2. Fetch current Admin CRM Settings
    const settings = await this.crmSettingsService.getSettings();
    const companyId = settings.crmCompanyId || '6a7c5eac4e89ab60b7c96017';
    const companyName = 'Insurance Company';
    const syncType = (lead.syncType || 'enquiry').toLowerCase();

    // 3. Re-verify current settings before retry
    const currentSnapshot: CrmSettingsSnapshot = {
      masterAutoSyncAtDecision: settings.crmSyncEnabled ?? true,
      syncUserRegistrationsAtDecision: settings.syncUserRegistrations ?? true,
      syncEnquiriesAtDecision: settings.syncEnquiries ?? true,
    };

    if (settings.crmSyncEnabled === false) {
      const reason = 'Retry blocked: Master Auto Sync is currently disabled';
      await this.leadRepository.updateById(id, {
        'crmSync.reason': reason,
        'crmSync.settingsSnapshot': currentSnapshot,
      });
      throw new BadRequestException(reason);
    }

    if (
      syncType === 'registration' &&
      settings.syncUserRegistrations === false
    ) {
      const reason =
        'Retry blocked: New User Registrations sync is currently disabled';
      await this.leadRepository.updateById(id, {
        'crmSync.reason': reason,
        'crmSync.settingsSnapshot': currentSnapshot,
      });
      throw new BadRequestException(reason);
    }

    if (
      (syncType === 'enquiry' || syncType === 'quote') &&
      settings.syncEnquiries === false
    ) {
      const reason =
        'Retry blocked: Insurance Quote Enquiries sync is currently disabled';
      await this.leadRepository.updateById(id, {
        'crmSync.reason': reason,
        'crmSync.settingsSnapshot': currentSnapshot,
      });
      throw new BadRequestException(reason);
    }

    // 4. Settings allow retry: Dispatch to CRM Ingest API
    this.logger.log(`Executing manual retry for Lead ID: ${id}`);

    const crmResult = await this.dispatchToCrm({
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      source: lead.source,
      syncType: lead.syncType || undefined,
      apiUrl: settings.crmApiUrl,
      apiKey: settings.crmApiKey,
    });

    const retryAudit: LeadCrmSyncAudit = {
      attempted: true,
      status: crmResult.ok ? 'SYNCED' : 'FAILED',
      companyId,
      companyName,
      crmLeadId: crmResult.leadId ?? lead.crmSync?.crmLeadId ?? null,
      crmLeadMongoId:
        crmResult.crmLeadMongoId ?? lead.crmSync?.crmLeadMongoId ?? null,
      reason: crmResult.ok ? null : crmResult.error ?? 'Retry submission failed',
      error: crmResult.ok ? null : crmResult.error ?? null,
      httpStatus: crmResult.httpStatus ?? (crmResult.ok ? 200 : 400),
      attemptedAt: new Date(),
      completedAt: crmResult.ok ? new Date() : null,
      settingsSnapshot: currentSnapshot,
      sanitizedRequest: crmResult.sanitizedRequest,
      sanitizedResponse: crmResult.response ?? null,
      crmEndpoint: 'https://crm.intefai.com/api/v1/ingest/lead',
    };

    const updated = (await this.leadRepository.updateById(id, {
      crmSync: retryAudit,
      'crm.companyId': companyId,
      'crm.leadId': crmResult.leadId ?? lead.crm?.leadId ?? null,
      'crm.crmLeadMongoId':
        crmResult.crmLeadMongoId ?? lead.crm?.crmLeadMongoId ?? null,
      'crm.submitted': crmResult.ok,
      'crm.response': crmResult.response ?? null,
      'crm.error': crmResult.error ?? null,
      'crm.submittedAt': crmResult.ok
        ? new Date()
        : lead.crm?.submittedAt ?? null,
      $inc: { 'crm.attempts': 1 },
    })) as LeadDocument;

    return {
      success: crmResult.ok,
      message: crmResult.ok
        ? 'Lead successfully synced to CRM on retry'
        : `CRM sync retry failed: ${crmResult.error || 'Unknown error'}`,
      crmSubmitted: crmResult.ok,
      lead: this.normalizeLeadAudit(updated ?? lead),
    };
  }

  /**
   * Paginated CRM leads query with filters
   */
  async findCrmLeads(query: CrmLeadsQueryOptions) {
    const result = await this.leadRepository.findCrmLeadsPaginated(query);
    const normalizedItems = result.items.map((item) =>
      this.normalizeLeadAudit(item),
    );
    return {
      items: normalizedItems,
      meta: result.meta,
    };
  }

  /**
   * CRM Lead Statistics for Summary KPI Cards
   */
  async getCrmStats(): Promise<CrmLeadStats> {
    return this.leadRepository.getCrmStats();
  }

  async findAll() {
    return this.findCrmLeads({ page: 1, limit: 100 });
  }

  async findOne(id: string) {
    const lead = await this.leadRepository.findById(id);
    if (!lead) throw new NotFoundException(`Lead with id "${id}" not found`);
    return this.normalizeLeadAudit(lead);
  }
}
