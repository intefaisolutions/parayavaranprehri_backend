import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { UpdateCrmSettingsDto } from './dto/update-crm-settings.dto';
import { CrmSettings, CrmSettingsDocument } from './schemas/crm-settings.schema';

@Injectable()
export class CrmSettingsService {
  private readonly logger = new Logger(CrmSettingsService.name);

  constructor(
    @InjectModel(CrmSettings.name)
    private readonly crmSettingsModel: Model<CrmSettingsDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Fetch current CRM settings from MongoDB.
   * If not present, creates initial record with project defaults.
   */
  async getSettings(): Promise<
    CrmSettingsDocument & {
      masterAutoSync: boolean;
      newUserRegistrations: boolean;
      insuranceQuoteEnquiries: boolean;
      lastConfigUpdate?: Date | null;
      lastLeadSync?: Date | null;
    }
  > {
    let settings = await this.crmSettingsModel.findOne({ isDeleted: false });

    if (!settings) {
      const defaultUrl =
        this.configService.get<string>('CRM_API_URL') ||
        'https://crm.intefai.com/api';
      const defaultKey =
        this.configService.get<string>('CRM_API_KEY') ||
        'iai_pk_live_c00d50d8f3c1fbbf0c287d58';
      const defaultSecret =
        this.configService.get<string>('CRM_API_SECRET') ||
        'ab9a1f16ef4f3e09060948e7bd9c50459c49cea252c140eaf11f9755b1e03c7d';
      const defaultCompanyId =
        this.configService.get<string>('CRM_COMPANY_ID') ||
        '6a7c5eac4e89ab60b7c96017';

      settings = await this.crmSettingsModel.create({
        crmApiUrl: defaultUrl,
        crmApiKey: defaultKey,
        crmApiSecret: defaultSecret,
        crmCompanyId: defaultCompanyId,
        crmSyncEnabled: true,
        syncUserRegistrations: true,
        syncEnquiries: true,
        syncCsvLeads: true,
        platformSource: 'Paryavaran Prahri Mobile App',
      });
      this.logger.log('Initialized default CRM Settings in MongoDB');
    }

    // Find the latest lead submitted to CRM
    const lastLead = await this.leadModel
      .findOne({ 'crm.submitted': true })
      .sort({ 'crm.submittedAt': -1, updatedAt: -1 })
      .select('crm.submittedAt updatedAt')
      .lean();

    const docObj = settings.toObject ? settings.toObject() : settings;
    return Object.assign(settings, {
      masterAutoSync: docObj.crmSyncEnabled,
      newUserRegistrations: docObj.syncUserRegistrations,
      insuranceQuoteEnquiries: docObj.syncEnquiries,
      lastConfigUpdate: (docObj as any).updatedAt || null,
      lastLeadSync: lastLead?.crm?.submittedAt || (lastLead as any)?.updatedAt || null,
    });
  }

  /**
   * Update CRM settings in MongoDB. Supports both standard and alias field names.
   */
  async updateSettings(dto: UpdateCrmSettingsDto): Promise<CrmSettingsDocument> {
    let settings = await this.crmSettingsModel.findOne({ isDeleted: false });

    if (!settings) {
      settings = new this.crmSettingsModel({});
    }

    if (dto.crmApiUrl !== undefined) settings.crmApiUrl = dto.crmApiUrl.trim();
    if (dto.crmApiKey !== undefined) settings.crmApiKey = dto.crmApiKey.trim();
    if (dto.crmApiSecret !== undefined) settings.crmApiSecret = dto.crmApiSecret.trim();
    if (dto.crmCompanyId !== undefined) settings.crmCompanyId = dto.crmCompanyId.trim();
    if (dto.platformSource !== undefined) settings.platformSource = dto.platformSource.trim();
    if (dto.syncCsvLeads !== undefined) settings.syncCsvLeads = dto.syncCsvLeads;

    // Master Auto Sync (supports crmSyncEnabled or masterAutoSync)
    if (dto.crmSyncEnabled !== undefined) {
      settings.crmSyncEnabled = dto.crmSyncEnabled;
    } else if (dto.masterAutoSync !== undefined) {
      settings.crmSyncEnabled = dto.masterAutoSync;
    }

    // New User Registrations (supports syncUserRegistrations or newUserRegistrations)
    if (dto.syncUserRegistrations !== undefined) {
      settings.syncUserRegistrations = dto.syncUserRegistrations;
    } else if (dto.newUserRegistrations !== undefined) {
      settings.syncUserRegistrations = dto.newUserRegistrations;
    }

    // Insurance Quote Enquiries (supports syncEnquiries or insuranceQuoteEnquiries)
    if (dto.syncEnquiries !== undefined) {
      settings.syncEnquiries = dto.syncEnquiries;
    } else if (dto.insuranceQuoteEnquiries !== undefined) {
      settings.syncEnquiries = dto.insuranceQuoteEnquiries;
    }

    const saved = await settings.save();
    this.logger.log(
      `CRM Settings updated: Master=${saved.crmSyncEnabled}, Registrations=${saved.syncUserRegistrations}, Enquiries=${saved.syncEnquiries}`,
    );

    const docObj = saved.toObject ? saved.toObject() : saved;
    return Object.assign(saved, {
      masterAutoSync: docObj.crmSyncEnabled,
      newUserRegistrations: docObj.syncUserRegistrations,
      insuranceQuoteEnquiries: docObj.syncEnquiries,
    });
  }

  /**
   * Test CRM Connection by pinging the IntefAI Lead Ingestion endpoint with credentials.
   */
  async testConnection(dto?: UpdateCrmSettingsDto): Promise<{
    ok: boolean;
    message: string;
    company?: string;
    status?: string;
    details?: any;
  }> {
    const current = await this.getSettings();
    const rawApiUrl =
      dto?.crmApiUrl || current.crmApiUrl || 'https://crm.intefai.com/api';
    const apiKey =
      dto?.crmApiKey ||
      current.crmApiKey ||
      'iai_pk_live_c00d50d8f3c1fbbf0c287d58';

    const baseUrl = rawApiUrl.replace(/\/+$/, '');
    const endpoint = baseUrl.endsWith('/v1/ingest/lead')
      ? baseUrl
      : `${baseUrl}/v1/ingest/lead`;

    try {
      this.logger.log(`Testing CRM connection to ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: 'Paryavaran Test Ping',
          phone: '+919999900000',
          platformSource: 'Paryavaran Admin Test',
          message: 'Verifying CRM API Connectivity',
          customData: { test: true, timestamp: new Date().toISOString() },
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (res.ok && (data?.success || data?.leadId)) {
        return {
          ok: true,
          status: 'connected',
          company: 'Insurance Company',
          message: 'CRM connection successful. Insurance Company connected.',
          details: data,
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          status: 'unauthorized',
          message: 'CRM connection failed: Invalid API Key or Unauthorized.',
          details: data,
        };
      } else {
        return {
          ok: false,
          status: 'error',
          message: `CRM connection response: ${data?.message || res.statusText}`,
          details: data,
        };
      }
    } catch (err: any) {
      return {
        ok: false,
        status: 'error',
        message: `CRM connection failed: ${err.message || 'Network timeout or unreachable'}`,
      };
    }
  }
}
