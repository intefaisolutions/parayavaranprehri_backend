import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle extends BaseSchema {
  @Prop({ required: true, trim: true })
  plate!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  vhId!: string;

  @Prop({ required: true, trim: true })
  fuel!: string;

  @Prop({ trim: true })
  insuranceId?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
VehicleSchema.index({ userId: 1 });
VehicleSchema.index({ plate: 1 }, { unique: true });
