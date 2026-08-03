import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type LandDocument = HydratedDocument<Land>;

export enum LandOwnershipType {
  GOVERNMENT = 'GOVERNMENT',
  PRIVATE = 'PRIVATE',
  FOREST_DEPARTMENT = 'FOREST_DEPARTMENT',
  SCHOOL_COLLEGE = 'SCHOOL_COLLEGE',
  PANCHAYAT = 'PANCHAYAT',
  NGO = 'NGO',
  CORPORATE_CSR = 'CORPORATE_CSR',
  OTHER = 'OTHER',
}

export enum LandAreaUnit {
  SQ_FT = 'SQ_FT',
  SQ_METER = 'SQ_METER',
  ACRE = 'ACRE',
  HECTARE = 'HECTARE',
}

export enum LandStatus {
  AVAILABLE = 'AVAILABLE',
  PARTIALLY_OCCUPIED = 'PARTIALLY_OCCUPIED',
  FULLY_OCCUPIED = 'FULLY_OCCUPIED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RESTRICTED = 'RESTRICTED',
}

@Schema({ timestamps: true, collection: 'lands' })
export class Land extends BaseSchema {
  @Prop({ unique: true, index: true })
  landId!: string;

  @Prop({ required: true, trim: true })
  landName!: string;

  @Prop({
    required: true,
    enum: LandOwnershipType,
    index: true,
  })
  ownershipType!: LandOwnershipType;

  @Prop({ trim: true })
  departmentName?: string;

  @Prop({ trim: true })
  ownerName?: string;

  @Prop({ trim: true })
  mobile?: string;

  /** Hierarchy: Country → State → District → Tehsil → Village/City → Land */
  @Prop({ trim: true, default: 'India', index: true })
  country?: string;

  @Prop({ trim: true, index: true })
  state?: string;

  @Prop({ trim: true, index: true })
  district?: string;

  @Prop({ trim: true })
  tehsil?: string;

  /** Village or City locality name */
  @Prop({ trim: true })
  villageOrCity?: string;

  /** @deprecated use villageOrCity — kept for older records */
  @Prop({ trim: true })
  village?: string;

  @Prop({ trim: true })
  landAddress?: string;

  @Prop({ trim: true })
  landmark?: string;

  @Prop({ trim: true, index: true })
  pinCode?: string;

  /**
   * Auto-mapped from lat/lng inside Vidhan Sabha polygon — not a land parent.
   */
  @Prop({ type: Types.ObjectId, ref: 'VidhanSabha', default: null, index: true })
  vidhanSabhaId?: Types.ObjectId | null;

  @Prop({ trim: true, index: true })
  vidhanSabha?: string;

  @Prop({ trim: true })
  khasraNumber?: string;

  @Prop({ required: true, min: 0 })
  totalArea!: number;

  @Prop({ required: true, enum: LandAreaUnit })
  areaUnit!: LandAreaUnit;

  /** Area normalized to acres for dashboards. */
  @Prop({ default: 0, min: 0 })
  totalAreaAcres!: number;

  @Prop({ default: 0, min: 0 })
  maxTreeCapacity!: number;

  /** True when maxTreeCapacity was typed manually (not spacing formula). */
  @Prop({ default: false })
  maxCapacityManual!: boolean;

  @Prop({ default: 0, min: 0 })
  plantedTrees!: number;

  @Prop({ default: 0, min: 0 })
  availableCapacity!: number;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  /** GeoJSON Point [lng, lat] for spatial queries */
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: { type: [Number] },
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({
    enum: LandStatus,
    default: LandStatus.AVAILABLE,
    index: true,
  })
  status!: LandStatus;

  @Prop({ trim: true })
  remarks?: string;
}

export const LandSchema = SchemaFactory.createForClass(Land);

LandSchema.index({
  landName: 'text',
  khasraNumber: 'text',
  village: 'text',
  villageOrCity: 'text',
  landAddress: 'text',
  landmark: 'text',
  pinCode: 'text',
  ownerName: 'text',
  landId: 'text',
});

LandSchema.index({ location: '2dsphere' });
LandSchema.index({ state: 1, district: 1, landName: 1 });
