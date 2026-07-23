import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MitraDocument = HydratedDocument<Mitra>;

export enum MitraMembership {
  FREE = 'free',
  PREMIUM = 'premium',
}

export enum MitraStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  CANCELLED = 'Cancelled',
}

@Schema({ timestamps: true, collection: 'mitras' })
export class Mitra extends BaseSchema {
  @Prop({ unique: true, index: true })
  mitraId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true })
  mobile!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  profession?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  vidhanSabha?: string;

  @Prop({ trim: true })
  assignedZone?: string;

  @Prop({ trim: true })
  district?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ enum: MitraMembership, default: MitraMembership.FREE })
  membership!: MitraMembership;

  @Prop({ enum: MitraStatus, default: MitraStatus.PENDING, index: true })
  status!: MitraStatus;

  @Prop({ type: Date, default: Date.now })
  joinedDate!: Date;

  @Prop({ default: 0 })
  treesPlanted!: number;

  @Prop({ type: [String], default: [] })
  badges!: string[];

  @Prop({ trim: true })
  remarks?: string;
}

export const MitraSchema = SchemaFactory.createForClass(Mitra);

MitraSchema.index({ name: 'text', mobile: 'text', mitraId: 'text' });
