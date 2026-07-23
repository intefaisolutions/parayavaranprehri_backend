import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type CertificateDocument = HydratedDocument<Certificate>;

export enum CertificateRecipientType {
  MITRA = 'MITRA',
  USER = 'USER',
}

export enum CertificateStatus {
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
}

@Schema({ timestamps: true, collection: 'certificates' })
export class Certificate extends BaseSchema {
  @Prop({ unique: true, index: true })
  certificateNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'CertificateTemplate', required: true })
  templateId!: Types.ObjectId;

  @Prop({
    enum: CertificateRecipientType,
    default: CertificateRecipientType.MITRA,
  })
  recipientType!: CertificateRecipientType;

  // For MITRA -> Mitra.mitraId (e.g. PM-000001); for USER -> User._id string
  @Prop({ required: true, index: true })
  recipientId!: string;

  @Prop({ required: true, trim: true })
  recipientName!: string;

  @Prop({ trim: true })
  recipientMobile?: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  eventName?: string;

  @Prop({ type: Date, default: Date.now })
  issueDate!: Date;

  @Prop({ trim: true })
  issuedBy?: string;

  @Prop()
  treesPlanted?: number;

  @Prop({ unique: true, index: true })
  verificationCode!: string;

  @Prop({ trim: true })
  pdfUrl?: string;

  @Prop({
    enum: CertificateStatus,
    default: CertificateStatus.ISSUED,
    index: true,
  })
  status!: CertificateStatus;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);

CertificateSchema.index({ recipientName: 'text', certificateNumber: 'text' });
