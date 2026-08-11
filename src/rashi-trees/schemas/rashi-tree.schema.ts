import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type RashiTreeDocument = HydratedDocument<RashiTree>;

@Schema({ timestamps: true, collection: 'rashi_trees' })
export class RashiTree extends BaseSchema {
  /** Multiple trees may share the same Rashi. */
  @Prop({ required: true, trim: true, index: true })
  rashiName!: string;

  @Prop({ required: true, trim: true })
  rashiNameHindi!: string;

  /** 1–12. Not unique — one zodiac can have many recommended trees. */
  @Prop({ required: true, min: 1, max: 12, index: true })
  zodiacNumber!: number;

  @Prop({ required: true, trim: true })
  recommendedTree!: string;

  @Prop({ trim: true })
  scientificName?: string;

  @Prop({ trim: true })
  localName?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  benefits!: string[];

  @Prop({ trim: true })
  careInstructions?: string;

  @Prop({ trim: true })
  image?: string;

  @Prop({ type: [String], default: [] })
  galleryImages!: string[];

  /** Ruling deity for this Rashi recommendation (CMS). */
  @Prop({ trim: true })
  deity?: string;

  /** Associated nakshatras (CMS). */
  @Prop({ type: [String], default: [] })
  nakshatras!: string[];

  /** Display bonuses shown on Rashi Van reveal (CMS, percent points). */
  @Prop({ type: Number, min: 0, max: 100 })
  karmaBonus?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  vitalityBonus?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  harmonyBonus?: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: 0, index: true })
  displayOrder!: number;
}

export const RashiTreeSchema = SchemaFactory.createForClass(RashiTree);

/** Same tree cannot be recommended twice for the same Rashi. */
RashiTreeSchema.index(
  { zodiacNumber: 1, recommendedTree: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    collation: { locale: 'en', strength: 2 },
  },
);

RashiTreeSchema.index({
  rashiName: 'text',
  rashiNameHindi: 'text',
  recommendedTree: 'text',
  scientificName: 'text',
  localName: 'text',
});
