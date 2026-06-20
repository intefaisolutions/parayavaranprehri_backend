import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type LandOfferDocument = HydratedDocument<LandOffer>;

@Schema({ timestamps: true, collection: 'land_offers' })
export class LandOffer extends BaseSchema {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true })
  mobile!: string;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ trim: true })
  landmark?: string;

  @Prop({ required: true, trim: true })
  availableArea!: string;

  @Prop({ required: true, trim: true })
  landSize!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
}

export const LandOfferSchema = SchemaFactory.createForClass(LandOffer);
LandOfferSchema.index({ userId: 1 });
