import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ContentType {
  PRIVACY_POLICY = 'privacy_policy',
  TERMS_CONDITIONS = 'terms_conditions',
  ABOUT_US = 'about_us',
}

@Schema({ timestamps: true })
export class Content extends Document {
  @Prop({ type: String, enum: ContentType, required: true, unique: true })
  type!: ContentType;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: Number, default: 1 })
  version!: number;

  @Prop({ type: String, enum: ['DRAFT', 'LIVE'], default: 'LIVE' })
  status!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy!: MongooseSchema.Types.ObjectId;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
