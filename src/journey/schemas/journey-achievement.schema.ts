import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type JourneyAchievementDocument = HydratedDocument<JourneyAchievement>;

export enum AchievementType {
  RECOGNITION = 'recognition',
  AWARD = 'award',
  RECORD = 'record',
  DOCTORATE = 'doctorate',
  INTERNATIONAL = 'international',
  MILESTONE = 'milestone',
  CERTIFICATION = 'certification',
}

@Schema({ timestamps: true, collection: 'journey_achievements' })
export class JourneyAchievement extends BaseSchema {
  @Prop({ required: true, trim: true, index: true })
  year!: string;

  @Prop({ enum: AchievementType, required: true, index: true })
  type!: AchievementType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  subtitle!: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ default: 0, index: true })
  displayOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const JourneyAchievementSchema =
  SchemaFactory.createForClass(JourneyAchievement);

JourneyAchievementSchema.index({ title: 'text', subtitle: 'text' });
