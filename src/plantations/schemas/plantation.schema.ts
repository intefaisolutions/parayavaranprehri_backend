import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PlantationDocument = HydratedDocument<Plantation>;

export enum PlantationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PLANTED = 'PLANTED',
}

@Schema({ timestamps: true, collection: 'plantations' })
export class Plantation extends BaseSchema {
  @Prop({ unique: true, index: true })
  plantationId!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'TreeMaster',
    required: true,
    index: true,
  })
  treeMasterId!: Types.ObjectId;

  @Prop({ trim: true, index: true })
  treeMasterName?: string;

  @Prop({ trim: true })
  scientificName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Land', required: true, index: true })
  landId!: Types.ObjectId;

  @Prop({ trim: true })
  landName?: string;

  @Prop({ trim: true, index: true })
  userId?: string;

  @Prop({ trim: true })
  userName?: string;

  @Prop({ trim: true, index: true })
  mobile?: string;

  @Prop({ type: Types.ObjectId, ref: 'Person', default: null })
  personId?: Types.ObjectId | null;

  @Prop({ type: Date, required: true })
  plantationDate!: Date;

  @Prop({ required: true, min: 1, default: 1 })
  count!: number;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({
    enum: PlantationStatus,
    default: PlantationStatus.PENDING,
    index: true,
  })
  status!: PlantationStatus;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  district?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true, index: true })
  vidhanSabha?: string;

  @Prop({ trim: true })
  remarks?: string;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop({ trim: true })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;

  /** Snapshot rates from Tree Master at request time (for reports) */
  @Prop({ default: 0, min: 0 })
  oxygenRateKgPerYear!: number;

  @Prop({ default: 0, min: 0 })
  co2RateKgPerYear!: number;
}

export const PlantationSchema = SchemaFactory.createForClass(Plantation);

PlantationSchema.index({
  plantationId: 'text',
  treeMasterName: 'text',
  landName: 'text',
  userName: 'text',
  mobile: 'text',
});
