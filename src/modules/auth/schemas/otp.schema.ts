import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true, collection: 'otps' })
export class Otp extends BaseSchema {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;

  @Prop({ default: false })
  isUsed!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
