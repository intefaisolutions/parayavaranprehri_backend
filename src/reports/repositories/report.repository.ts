import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Report, ReportDocument } from '../schemas/report.schema';

@Injectable()
export class ReportRepository extends BaseRepository<ReportDocument> {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
  ) {
    super(reportModel);
  }
}
