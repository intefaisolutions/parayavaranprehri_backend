import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MitraEventDocument = HydratedDocument<MitraEvent>;

@Schema({ timestamps: true, collection: 'mitra_events' })
export class MitraEvent extends BaseSchema {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: Date, required: true, index: true })
  date!: Date;

  @Prop({ trim: true })
  time?: string;

  @Prop({ required: true, trim: true })
  location!: string;

  @Prop({ trim: true })
  organizer?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const MitraEventSchema = SchemaFactory.createForClass(MitraEvent);

MitraEventSchema.index({ title: 'text', location: 'text', organizer: 'text' });
