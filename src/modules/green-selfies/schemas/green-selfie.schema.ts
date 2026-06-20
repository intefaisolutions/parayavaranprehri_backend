import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type GreenSelfieDocument = HydratedDocument<GreenSelfie>;

@Schema({ timestamps: true, collection: 'green_selfies' })
export class GreenSelfie extends BaseSchema {
  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ required: true, trim: true })
  imageUrl!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const GreenSelfieSchema = SchemaFactory.createForClass(GreenSelfie);
GreenSelfieSchema.index({ userId: 1 });
