import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type VidhanSabhaDocument = HydratedDocument<VidhanSabha>;

export enum VidhanSabhaStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'vidhan_sabhas' })
export class VidhanSabha extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true })
  vidhanSabhaName!: string;

  @Prop({ trim: true, index: true })
  district?: string;

  @Prop({ trim: true, default: 'Madhya Pradesh' })
  state?: string;

  @Prop({ default: 0, min: 0 })
  totalPersons!: number;

  @Prop({ default: 0, min: 0 })
  totalVehicles!: number;

  @Prop({ default: 0, min: 0 })
  totalTrees!: number;

  @Prop({ default: 0, min: 0 })
  totalMitras!: number;

  @Prop({ trim: true })
  assignedAdmin?: string;

  @Prop({ enum: VidhanSabhaStatus, default: VidhanSabhaStatus.ACTIVE, index: true })
  status!: VidhanSabhaStatus;
}

export const VidhanSabhaSchema = SchemaFactory.createForClass(VidhanSabha);

VidhanSabhaSchema.index({
  vidhanSabhaName: 'text',
  district: 'text',
  state: 'text',
  assignedAdmin: 'text',
});
