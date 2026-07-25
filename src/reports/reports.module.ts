import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportRepository } from './repositories/report.repository';
import { Report, ReportSchema } from './schemas/report.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
