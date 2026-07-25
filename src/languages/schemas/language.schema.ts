import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type LanguageDocument = HydratedDocument<Language>;

export enum LanguageStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'languages' })
export class Language extends BaseSchema {
  @Prop({ required: true, trim: true })
  languageName!: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  languageCode!: string;

  @Prop({ default: 0, min: 0, max: 100 })
  translationProgress!: number;

  @Prop({ enum: LanguageStatus, default: LanguageStatus.ACTIVE, index: true })
  status!: LanguageStatus;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);

LanguageSchema.index({
  languageName: 'text',
  languageCode: 'text',
});
