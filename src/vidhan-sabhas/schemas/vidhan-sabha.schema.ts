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

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true, index: true })
  district?: string;

  @Prop({ trim: true, default: 'Madhya Pradesh' })
  state?: string;

  /**
   * GeoJSON Polygon / MultiPolygon boundary used to auto-map lands by lat/lng.
   * Coordinates are [longitude, latitude] per GeoJSON spec.
   */
  @Prop({
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
    },
    coordinates: { type: Array },
  })
  boundary?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };

  /** Cached from boundary polygon (km²). Recalculated on boundary save. */
  @Prop({ type: Number, default: null, min: 0 })
  areaKm2?: number | null;

  /** Cached from boundary polygon (km). Recalculated on boundary save. */
  @Prop({ type: Number, default: null, min: 0 })
  perimeterKm?: number | null;

  @Prop({ default: 0, min: 0 })
  totalPersons!: number;

  @Prop({ default: 0, min: 0 })
  totalVehicles!: number;

  @Prop({ default: 0, min: 0 })
  totalTrees!: number;

  /** Sum of trees' estimated annual O₂ (kg/year) for this constituency. */
  @Prop({ default: 0, min: 0 })
  totalAnnualOxygenKg!: number;

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

VidhanSabhaSchema.index({ boundary: '2dsphere' });
