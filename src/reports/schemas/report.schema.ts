import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type ReportDocument = HydratedDocument<Report>;

export enum ReportType {
  TREE_REPORT = 'Tree Report',
  ACTIVITY_REPORT = 'Activity Report',
  VEHICLE_REPORT = 'Vehicle Report',
  PERSON_REPORT = 'Person Report',
  MITRA_REPORT = 'Mitra Report',
}

export enum ReportFileType {
  PDF = 'PDF',
  EXCEL = 'Excel',
}

export enum ReportStatus {
  GENERATING = 'Generating',
  GENERATED = 'Generated',
  FAILED = 'Failed',
}

@Schema({ timestamps: true, collection: 'reports' })
export class Report extends BaseSchema {
  @Prop({ required: true, trim: true })
  reportName!: string;

  @Prop({ enum: ReportType, required: true, index: true })
  reportType!: ReportType;

  @Prop({ required: true, trim: true })
  generatedBy!: string;

  @Prop({ trim: true })
  locationFilter?: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ enum: ReportFileType, required: true })
  fileType!: ReportFileType;

  @Prop({ trim: true })
  fileUrl?: string;

  @Prop({ enum: ReportStatus, default: ReportStatus.GENERATED, index: true })
  status!: ReportStatus;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({
  reportName: 'text',
  generatedBy: 'text',
  locationFilter: 'text',
});
