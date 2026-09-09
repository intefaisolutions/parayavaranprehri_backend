import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type LeadDocument = HydratedDocument<Lead>;

export type CrmSyncStatus = 'SYNCED' | 'SKIPPED' | 'FAILED' | 'PENDING';

@Schema({ _id: false })
export class CrmSettingsSnapshot {
  @Prop({ type: Boolean, default: true })
  masterAutoSyncAtDecision!: boolean;

  @Prop({ type: Boolean, default: true })
  syncUserRegistrationsAtDecision!: boolean;

  @Prop({ type: Boolean, default: true })
  syncEnquiriesAtDecision!: boolean;
}

const CrmSettingsSnapshotSchema = SchemaFactory.createForClass(CrmSettingsSnapshot);

@Schema({ _id: false })
export class LeadCrmSyncAudit {
  @Prop({ type: Boolean, default: false })
  attempted!: boolean;

  @Prop({
    type: String,
    enum: ['SYNCED', 'SKIPPED', 'FAILED', 'PENDING'],
    default: 'PENDING',
    index: true,
  })
  status!: CrmSyncStatus;

  @Prop({ type: String, default: null })
  companyId?: string | null;

  @Prop({ type: String, default: 'Insurance Company' })
  companyName?: string;

  @Prop({ type: String, default: null, index: true })
  crmLeadId?: string | null;

  @Prop({ type: String, default: null })
  crmLeadMongoId?: string | null;

  @Prop({ type: String, default: null })
  reason?: string | null;

  @Prop({ type: String, default: null })
  error?: string | null;

  @Prop({ type: Number, default: null })
  httpStatus?: number | null;

  @Prop({ type: Date, default: null })
  attemptedAt?: Date | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: CrmSettingsSnapshotSchema, default: null })
  settingsSnapshot?: CrmSettingsSnapshot;

  @Prop({ type: Object, default: null })
  sanitizedRequest?: Record<string, unknown> | null;

  @Prop({ type: Object, default: null })
  sanitizedResponse?: Record<string, unknown> | null;

  @Prop({ type: String, default: 'https://crm.intefai.com/api/v1/ingest/lead' })
  crmEndpoint?: string;
}

const LeadCrmSyncAuditSchema = SchemaFactory.createForClass(LeadCrmSyncAudit);

@Schema({ _id: false })
export class LeadCrmDetails {
  @Prop({ type: String, default: null })
  leadId?: string | null;

  @Prop({ type: String, default: null })
  crmLeadMongoId?: string | null;

  @Prop({ type: String, default: null })
  companyId?: string | null;

  @Prop({ type: String, default: null })
  formId?: string | null;

  @Prop({ type: Boolean, default: false })
  submitted!: boolean;

  @Prop({ type: Object, default: null })
  response?: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  error?: string | null;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  attempts!: number;
}

const LeadCrmDetailsSchema = SchemaFactory.createForClass(LeadCrmDetails);

@Schema({ timestamps: true, collection: 'leads' })
export class Lead extends BaseSchema {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  mobile!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ default: 'Paryavaran Prahri Mobile App', trim: true })
  source!: string;

  @Prop({ type: String, default: 'enquiry', trim: true })
  syncType?: string | null;

  @Prop({
    type: LeadCrmDetailsSchema,
    default: () => ({ submitted: false, attempts: 0 }),
  })
  crm!: LeadCrmDetails;

  @Prop({
    type: LeadCrmSyncAuditSchema,
    default: () => ({ attempted: false, status: 'PENDING' }),
  })
  crmSync!: LeadCrmSyncAudit;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

LeadSchema.index(
  { mobile: 1 },
  { partialFilterExpression: { isDeleted: false } },
);
LeadSchema.index({ 'crmSync.status': 1 });
LeadSchema.index({ 'crmSync.crmLeadId': 1 });
LeadSchema.index({ createdAt: -1 });
