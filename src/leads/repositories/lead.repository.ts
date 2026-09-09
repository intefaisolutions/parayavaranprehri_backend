import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Lead, LeadDocument } from '../schemas/lead.schema';

export interface CrmLeadsQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  leadType?: string;
  company?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrmLeadStats {
  total: number;
  synced: number;
  skipped: number;
  failed: number;
  pending: number;
}

@Injectable()
export class LeadRepository extends BaseRepository<LeadDocument> {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {
    super(leadModel);
  }

  async findByMobile(mobile: string): Promise<LeadDocument | null> {
    return this.leadModel.findOne({ mobile, isDeleted: false }).exec();
  }

  async findByEmail(email: string): Promise<LeadDocument | null> {
    return this.leadModel
      .findOne({ email: email.toLowerCase().trim(), isDeleted: false })
      .exec();
  }

  async findCrmLeadsPaginated(options: CrmLeadsQueryOptions): Promise<{
    items: LeadDocument[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    // 1. Text Search across Name, Mobile, Email, Lead ID, CRM Lead ID
    if (options.search && options.search.trim()) {
      const s = options.search.trim();
      const orClauses: Record<string, any>[] = [
        { name: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { 'crmSync.crmLeadId': { $regex: s, $options: 'i' } },
        { 'crm.leadId': { $regex: s, $options: 'i' } },
      ];

      if (Types.ObjectId.isValid(s)) {
        orClauses.push({ _id: new Types.ObjectId(s) });
      }

      filter.$or = orClauses;
    }

    // 2. Status Filter with fallback to legacy 'crm' fields
    if (options.status && options.status.toLowerCase() !== 'all') {
      const st = options.status.toUpperCase();
      if (st === 'SYNCED') {
        const syncedClause = [
          { 'crmSync.status': 'SYNCED' },
          { 'crm.submitted': true },
        ];
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: syncedClause });
      } else if (st === 'SKIPPED') {
        const skippedClause = [
          { 'crmSync.status': 'SKIPPED' },
          { 'crm.error': { $regex: 'SKIPPED', $options: 'i' } },
        ];
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: skippedClause });
      } else if (st === 'FAILED') {
        const failedClause = [
          { 'crmSync.status': 'FAILED' },
          {
            'crm.submitted': false,
            'crm.error': { $ne: null, $not: { $regex: 'SKIPPED', $options: 'i' } },
          },
        ];
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: failedClause });
      } else if (st === 'PENDING') {
        const pendingClause = [
          { 'crmSync.status': 'PENDING' },
          {
            'crm.submitted': false,
            'crm.error': null,
            'crmSync.status': { $exists: false },
          },
        ];
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: pendingClause });
      }
    }

    // 3. Lead Type filter
    if (options.leadType && options.leadType.toLowerCase() !== 'all') {
      filter.syncType = { $regex: `^${options.leadType}$`, $options: 'i' };
    }

    // 4. Company filter
    if (options.company && options.company.toLowerCase() !== 'all') {
      const companyClause = [
        { 'crmSync.companyId': options.company },
        { 'crmSync.companyName': { $regex: options.company, $options: 'i' } },
        { 'crm.companyId': options.company },
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: companyClause });
    }

    // 5. Date range filter
    if (options.from || options.to) {
      filter.createdAt = filter.createdAt || {};
      if (options.from) {
        const fromDate = new Date(options.from);
        if (!isNaN(fromDate.getTime())) {
          filter.createdAt.$gte = fromDate;
        }
      }
      if (options.to) {
        const toDate = new Date(options.to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = toDate;
        }
      }
    }

    const sortField = options.sortBy || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.leadModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getCrmStats(): Promise<CrmLeadStats> {
    const [total, synced, skipped, failed, pending] = await Promise.all([
      this.leadModel.countDocuments({ isDeleted: false }).exec(),
      this.leadModel
        .countDocuments({
          isDeleted: false,
          $or: [{ 'crmSync.status': 'SYNCED' }, { 'crm.submitted': true }],
        })
        .exec(),
      this.leadModel
        .countDocuments({
          isDeleted: false,
          $or: [
            { 'crmSync.status': 'SKIPPED' },
            { 'crm.error': { $regex: 'SKIPPED', $options: 'i' } },
          ],
        })
        .exec(),
      this.leadModel
        .countDocuments({
          isDeleted: false,
          $or: [
            { 'crmSync.status': 'FAILED' },
            {
              'crm.submitted': false,
              'crm.error': { $ne: null, $not: { $regex: 'SKIPPED', $options: 'i' } },
            },
          ],
        })
        .exec(),
      this.leadModel
        .countDocuments({
          isDeleted: false,
          $or: [
            { 'crmSync.status': 'PENDING' },
            {
              'crm.submitted': false,
              'crm.error': null,
              'crmSync.status': { $exists: false },
            },
          ],
        })
        .exec(),
    ]);

    return { total, synced, skipped, failed, pending };
  }
}
