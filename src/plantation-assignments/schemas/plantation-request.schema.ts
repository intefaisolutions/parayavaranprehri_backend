import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PlantationRequestDocument = HydratedDocument<PlantationRequest>;

export enum PlantationRequestStatus {
  PENDING = 'PENDING',
  PARTIALLY_ASSIGNED = 'PARTIALLY_ASSIGNED',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'plantation_requests' })
export class PlantationRequest extends BaseSchema {
  @Prop({ unique: true, index: true })
  requestId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, uppercase: true, index: true })
  insuranceId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', default: null })
  vehicleId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, uppercase: true })
  vehiclePlate!: string;

  @Prop({ required: true, trim: true })
  vehicleType!: string;

  @Prop({ required: true, min: 0 })
  requiredTreeCount!: number;

  @Prop({ default: 0, min: 0 })
  suggestedTreeCount!: number;

  @Prop({ default: 0, min: 0 })
  autoAssignedTreeCount!: number;

  @Prop({ default: 1, min: 0 })
  maxUserSuggestions!: number;

  @Prop({
    enum: PlantationRequestStatus,
    default: PlantationRequestStatus.PENDING,
    index: true,
  })
  status!: PlantationRequestStatus;

  @Prop({ type: Date, required: true })
  suggestionDeadline!: Date;
}

export const PlantationRequestSchema =
  SchemaFactory.createForClass(PlantationRequest);

PlantationRequestSchema.index({ userId: 1, status: 1 });
PlantationRequestSchema.index({ vehiclePlate: 1 });
