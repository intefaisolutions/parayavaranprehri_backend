import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type CrmSettingsDocument = HydratedDocument<CrmSettings>;

@Schema({ timestamps: true, collection: 'crmsettings' })
export class CrmSettings extends BaseSchema {
  @Prop({ type: String, default: 'https://crm.intefai.com/api', trim: true })
  crmApiUrl!: string;

  @Prop({ type: String, default: 'iai_pk_live_c00d50d8f3c1fbbf0c287d58', trim: true })
  crmApiKey!: string;

  @Prop({ type: String, default: '', trim: true })
  crmApiSecret!: string;

  @Prop({ type: String, default: '6a7c5eac4e89ab60b7c96017', trim: true })
  crmCompanyId!: string;

  @Prop({ type: Boolean, default: true })
  crmSyncEnabled!: boolean; // Master Auto Sync

  @Prop({ type: Boolean, default: true })
  syncUserRegistrations!: boolean; // New User Registrations

  @Prop({ type: Boolean, default: true })
  syncEnquiries!: boolean; // Insurance Quote Enquiries

  @Prop({ type: Boolean, default: true })
  syncCsvLeads!: boolean;

  @Prop({ type: String, default: 'Paryavaran Prahri Mobile App', trim: true })
  platformSource!: string;
}

export const CrmSettingsSchema = SchemaFactory.createForClass(CrmSettings);
