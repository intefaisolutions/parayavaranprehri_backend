import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type RashiTreeDocument = HydratedDocument<RashiTree>;

@Schema({ timestamps: true, collection: 'rashi_trees' })
export class RashiTree extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true })
  rashiName!: string;

  @Prop({ required: true, trim: true })
  rashiNameHindi!: string;

  @Prop({ required: true, unique: true, min: 1, max: 12 })
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

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: 0, index: true })
  displayOrder!: number;
}

export const RashiTreeSchema = SchemaFactory.createForClass(RashiTree);

RashiTreeSchema.index({
  rashiName: 'text',
  rashiNameHindi: 'text',
  recommendedTree: 'text',
  scientificName: 'text',
  localName: 'text',
});
