import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PartnerDocument = HydratedDocument<Partner>;

export enum PartnerType {
  NGO = 'NGO',
  CORPORATE = 'Corporate',
  GOVERNMENT = 'Government',
  INDIVIDUAL = 'Individual',
}

export enum PartnerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'partners' })
export class Partner extends BaseSchema {
  @Prop({ required: true, trim: true })
  partnerName!: string;

  @Prop({ enum: PartnerType, required: true })
  partnerType!: PartnerType;

  @Prop({ required: true, trim: true })
  contactPerson!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ enum: PartnerStatus, default: PartnerStatus.ACTIVE, index: true })
  status!: PartnerStatus;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);

PartnerSchema.index({
  partnerName: 'text',
  contactPerson: 'text',
  phone: 'text',
  location: 'text',
});
