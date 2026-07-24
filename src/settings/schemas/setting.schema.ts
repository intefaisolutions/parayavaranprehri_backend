import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type SettingDocument = HydratedDocument<Setting>;

export const SETTING_CATEGORIES = [
  'General',
  'Security',
  'Notification',
  'Email',
  'Payment',
  'User Management',
] as const;

export type SettingCategory = (typeof SETTING_CATEGORIES)[number];

@Schema({ timestamps: true, collection: 'settings' })
export class Setting extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true })
  settingName!: string;

  @Prop({ required: true, trim: true, index: true, enum: SETTING_CATEGORIES })
  category!: SettingCategory;

  @Prop({ required: true, trim: true })
  value!: string;

  @Prop({ trim: true })
  updatedBy?: string;

  @Prop({ type: Date, default: Date.now })
  lastUpdatedDate!: Date;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

SettingSchema.index({
  settingName: 'text',
  category: 'text',
  value: 'text',
});
