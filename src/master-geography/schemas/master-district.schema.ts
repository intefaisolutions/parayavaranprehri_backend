import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MasterDistrictDocument = HydratedDocument<MasterDistrict>;

@Schema({ timestamps: true, collection: 'master_districts' })
export class MasterDistrict {
  @Prop({ required: true, unique: true, trim: true, index: true })
  masterId!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  state!: string;

  @Prop({ required: true, trim: true, default: 'India', index: true })
  country!: string;
}

export const MasterDistrictSchema = SchemaFactory.createForClass(MasterDistrict);
MasterDistrictSchema.index({ country: 1, state: 1, name: 1 }, { unique: true });
