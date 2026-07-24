import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type AuditLogDocument = HydratedDocument<AuditLog>;

export const AUDIT_ACTION_TYPES = [
  'Create',
  'Update',
  'Delete',
  'Login',
] as const;

export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number];

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog extends BaseSchema {
  @Prop({ required: true, trim: true, index: true })
  userName!: string;

  @Prop({ trim: true })
  role?: string;

  @Prop({ required: true, trim: true, index: true })
  moduleName!: string;

  @Prop({ required: true, trim: true, index: true })
  actionType!: string;

  @Prop({ trim: true })
  recordId?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  dateTime!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({
  userName: 'text',
  role: 'text',
  moduleName: 'text',
  actionType: 'text',
  recordId: 'text',
  description: 'text',
  ipAddress: 'text',
});
