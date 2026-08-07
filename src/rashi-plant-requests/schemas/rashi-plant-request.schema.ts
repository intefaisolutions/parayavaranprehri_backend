import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type RashiPlantRequestDocument = HydratedDocument<RashiPlantRequest>;

export enum RashiPlantRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true, collection: 'rashi_plant_requests' })
export class RashiPlantRequest extends BaseSchema {
  @Prop({ unique: true, index: true })
  requestId!: string;

  @Prop({ trim: true, index: true })
  userId?: string;

  @Prop({ trim: true })
  userName?: string;

  @Prop({ trim: true, index: true })
  mobile?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  district?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ required: true, trim: true, index: true })
  rashiName!: string;

  @Prop({ trim: true })
  rashiNameHindi?: string;

  @Prop({ required: true, trim: true, index: true })
  recommendedTree!: string;

  @Prop({ trim: true })
  scientificName?: string;

  @Prop({ trim: true })
  localName?: string;

  @Prop({ trim: true })
  treeDescription?: string;

  @Prop({ type: [String], default: [] })
  benefits!: string[];

  @Prop({
    enum: RashiPlantRequestStatus,
    default: RashiPlantRequestStatus.PENDING,
    index: true,
  })
  status!: RashiPlantRequestStatus;

  @Prop({ trim: true })
  remarks?: string;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop({ trim: true })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;
}

export const RashiPlantRequestSchema =
  SchemaFactory.createForClass(RashiPlantRequest);

RashiPlantRequestSchema.index({
  requestId: 'text',
  userName: 'text',
  mobile: 'text',
  rashiName: 'text',
  recommendedTree: 'text',
});
