import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type FieldIssueDocument = HydratedDocument<FieldIssue>;

export enum FieldIssueType {
  MISSING = 'Missing',
  WATER_SHORTAGE = 'Water Shortage',
  DEAD_TREE = 'Dead Tree',
  DAMAGED_GUARD = 'Damaged Guard',
  DISEASE_PEST = 'Disease/Pest',
  OTHER = 'Other',
}

export enum FieldIssuePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum FieldIssueStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

@Schema({ timestamps: true, collection: 'field_issues' })
export class FieldIssue extends BaseSchema {
  @Prop({ enum: FieldIssueType, required: true, index: true })
  type!: FieldIssueType;

  @Prop({
    enum: FieldIssuePriority,
    default: FieldIssuePriority.MEDIUM,
    index: true,
  })
  priority!: FieldIssuePriority;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ trim: true, index: true })
  treeCode?: string;

  @Prop({ trim: true, index: true })
  mitraId?: string;

  @Prop({ trim: true, index: true })
  reportedByUserId?: string;

  @Prop({ trim: true })
  reportedByName?: string;

  @Prop({
    enum: FieldIssueStatus,
    default: FieldIssueStatus.OPEN,
    index: true,
  })
  status!: FieldIssueStatus;

  @Prop({ type: [String], default: [] })
  photoUrls!: string[];

  @Prop({ trim: true })
  resolutionNotes?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;
}

export const FieldIssueSchema = SchemaFactory.createForClass(FieldIssue);

FieldIssueSchema.index({ description: 'text', treeCode: 'text' });
