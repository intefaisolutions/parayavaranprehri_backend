import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportRepository } from './repositories/report.repository';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async create(dto: CreateReportDto): Promise<Report> {
    return this.reportRepository.create(
      dto as unknown as Partial<ReportDocument>,
    );
  }

  async findAll(query: ReportQueryDto): Promise<PaginatedResult<Report>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.reportType !== undefined) {
      baseFilter.reportType = query.reportType;
    }
    if (query.fileType !== undefined) {
      baseFilter.fileType = query.fileType;
    }
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    return this.reportRepository.findPaginated(options, baseFilter, [
      'reportName',
      'generatedBy',
      'locationFilter',
    ]);
  }

  async findOne(id: string): Promise<Report> {
    const entry = await this.reportRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Report "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateReportDto): Promise<Report> {
    const updated = await this.reportRepository.updateById(
      id,
      dto as unknown as Partial<ReportDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Report "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.reportRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Report "${id}" not found`);
    }
  }
}
