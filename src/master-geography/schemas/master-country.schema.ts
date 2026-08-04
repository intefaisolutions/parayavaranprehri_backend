import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MasterCountryDocument = HydratedDocument<MasterCountry>;

@Schema({ timestamps: true, collection: 'master_countries' })
export class MasterCountry {
  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, unique: true, trim: true })
  name!: string;
}

export const MasterCountrySchema = SchemaFactory.createForClass(MasterCountry);
