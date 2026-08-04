import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type MasterConstituencyDocument = HydratedDocument<MasterConstituency>;

@Schema({ timestamps: true, collection: 'master_constituencies' })
export class MasterConstituency {
  /** Stable public id used by admin APIs, e.g. mp-indore-3 */
  @Prop({ required: true, unique: true, trim: true, index: true })
  masterId!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, default: 'India', index: true })
  country!: string;

  @Prop({ required: true, trim: true, index: true })
  state!: string;

  @Prop({ required: true, trim: true, index: true })
  district!: string;

  @Prop({ type: Number, default: null })
  assemblyNumber?: number | null;

  /**
   * Optional GeoJSON Polygon / MultiPolygon.
   * Can be missing until ECI/OGD boundary import.
   */
  @Prop({ type: SchemaTypes.Mixed })
  boundary?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export const MasterConstituencySchema =
  SchemaFactory.createForClass(MasterConstituency);

MasterConstituencySchema.index({ country: 1, state: 1, district: 1, name: 1 });
