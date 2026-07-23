import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type CertificateTemplateDocument = HydratedDocument<CertificateTemplate>;

export enum CertificateTemplateStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'certificate_templates' })
export class CertificateTemplate extends BaseSchema {
  @Prop({ required: true, trim: true })
  certificateType!: string;

  @Prop({ required: true, trim: true })
  templateName!: string;

  @Prop({ trim: true })
  logoUrl?: string;

  @Prop({ trim: true })
  signatureUrl?: string;

  @Prop({ trim: true })
  backgroundUrl?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    enum: CertificateTemplateStatus,
    default: CertificateTemplateStatus.ACTIVE,
    index: true,
  })
  status!: CertificateTemplateStatus;

  @Prop({ trim: true })
  lastUpdatedBy?: string;
}

export const CertificateTemplateSchema = SchemaFactory.createForClass(
  CertificateTemplate,
);

CertificateTemplateSchema.index({ certificateType: 'text', templateName: 'text' });
