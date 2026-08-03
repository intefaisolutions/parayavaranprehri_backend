import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type TreeMasterDocument = HydratedDocument<TreeMaster>;

export enum TreeAvailability {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  AVAILABLE_ON_REQUEST = 'AVAILABLE_ON_REQUEST',
}

export enum WaterRequirement {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GrowthRate {
  SLOW = 'SLOW',
  MEDIUM = 'MEDIUM',
  FAST = 'FAST',
}

@Schema({ timestamps: true, collection: 'tree_masters' })
export class TreeMaster extends BaseSchema {
  @Prop({ unique: true, index: true })
  treeMasterId!: string;

  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  scientificName?: string;

  /** Short species key used for O₂ utils / search (e.g. Neem) */
  @Prop({ trim: true, index: true })
  species?: string;

  @Prop({ trim: true, index: true })
  category?: string;

  @Prop({ min: 0 })
  expectedLifespanYears?: number;

  /** Average annual O₂ production (kg/year) for catalog display */
  @Prop({ default: 0, min: 0 })
  oxygenRateKgPerYear!: number;

  /** Average annual CO₂ absorption (kg/year) */
  @Prop({ default: 0, min: 0 })
  co2RateKgPerYear!: number;

  @Prop({ enum: WaterRequirement, default: WaterRequirement.MEDIUM })
  waterRequirement!: WaterRequirement;

  @Prop({ enum: GrowthRate, default: GrowthRate.MEDIUM })
  growthRate!: GrowthRate;

  @Prop({ trim: true })
  suitableClimate?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  benefits!: string[];

  @Prop({ trim: true })
  image?: string;

  @Prop({
    enum: TreeAvailability,
    default: TreeAvailability.AVAILABLE,
    index: true,
  })
  availability!: TreeAvailability;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: 0, index: true })
  displayOrder!: number;
}

export const TreeMasterSchema = SchemaFactory.createForClass(TreeMaster);

TreeMasterSchema.index({
  name: 'text',
  scientificName: 'text',
  species: 'text',
  category: 'text',
  description: 'text',
});
