import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MasterStateDocument = HydratedDocument<MasterState>;

@Schema({ timestamps: true, collection: 'master_states' })
export class MasterState {
  @Prop({ required: true, unique: true, trim: true, index: true })
  masterId!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, default: 'India', index: true })
  country!: string;
}

export const MasterStateSchema = SchemaFactory.createForClass(MasterState);
MasterStateSchema.index({ country: 1, name: 1 }, { unique: true });
