import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type JourneyProfileDocument = HydratedDocument<JourneyProfile>;

@Schema({ _id: false })
export class JourneyStat {
  @Prop({ required: true })
  value!: string;

  @Prop({ required: true })
  label!: string;
}

@Schema({ timestamps: true, collection: 'journey_profiles' })
export class JourneyProfile extends BaseSchema {
  @Prop({ required: true, trim: true, default: 'Dr. Ram Patidar' })
  name!: string;

  @Prop({ trim: true, default: 'Journey & Achievements' })
  subtitle?: string;

  @Prop({ trim: true })
  photo?: string;

  @Prop({ type: [JourneyStat], default: [] })
  stats!: JourneyStat[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ trim: true })
  inspirationText?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const JourneyProfileSchema =
  SchemaFactory.createForClass(JourneyProfile);
