import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async create(
    dto: CreateAuditLogDto,
    user?: JwtPayload,
    ip?: string,
  ): Promise<AuditLog> {
    return this.auditLogRepository.create({
      ...dto,
      userName: dto.userName || user?.email || 'System',
      role: dto.role || user?.role,
      ipAddress: dto.ipAddress || ip,
      dateTime: dto.dateTime ? new Date(dto.dateTime) : new Date(),
    } as Partial<AuditLogDocument>);
  }

  async findAll(query: AuditLogQueryDto): Promise<PaginatedResult<AuditLog>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.moduleName) {
      baseFilter.moduleName = query.moduleName;
    }
    if (query.actionType) {
      baseFilter.actionType = query.actionType;
    }

    return this.auditLogRepository.findPaginated(options, baseFilter, [
      'userName',
      'role',
      'moduleName',
      'actionType',
      'recordId',
      'description',
      'ipAddress',
    ]);
  }

  async findOne(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findById(id);
    if (!log) {
      throw new NotFoundException(`Audit log "${id}" not found`);
    }
    return log;
  }

  async update(id: string, dto: UpdateAuditLogDto): Promise<AuditLog> {
    const updateData: Partial<AuditLogDocument> = { ...dto } as Partial<AuditLogDocument>;
    if (dto.dateTime) {
      updateData.dateTime = new Date(dto.dateTime);
    }

    const updated = await this.auditLogRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Audit log "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.auditLogRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Audit log "${id}" not found`);
    }
  }
}
