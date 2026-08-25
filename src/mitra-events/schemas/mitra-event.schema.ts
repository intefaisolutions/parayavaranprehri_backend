import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MitraEventDocument = HydratedDocument<MitraEvent>;

export enum EventType {
  OFFLINE = 'Offline',
  ONLINE = 'Online',
  HYBRID = 'Hybrid',
}

@Schema({ _id: false })
export class OfflineDetails {
  @Prop({ trim: true })
  venue?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

@Schema({ _id: false })
export class OnlineDetails {
  @Prop({ trim: true })
  platform?: string;

  @Prop({ trim: true })
  meetingUrl?: string;

  @Prop({ trim: true })
  meetingId?: string;

  @Prop({ trim: true })
  passcode?: string;
}

@Schema({ timestamps: true, collection: 'mitra_events' })
export class MitraEvent extends BaseSchema {
  @Prop({ required: true, enum: EventType, default: EventType.OFFLINE })
  eventType!: EventType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: Date, required: true, index: true })
  date!: Date;

  @Prop({ trim: true })
  time?: string;

  @Prop({ trim: true })
  endTime?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  organizer?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: OfflineDetails })
  offlineDetails?: OfflineDetails;

  @Prop({ type: OnlineDetails })
  onlineDetails?: OnlineDetails;

  @Prop({ trim: true })
  bannerImage?: string;

  @Prop({ default: false })
  registrationRequired?: boolean;

  @Prop({ type: Date })
  registrationDeadline?: Date;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const MitraEventSchema = SchemaFactory.createForClass(MitraEvent);

MitraEventSchema.index({ title: 'text', location: 'text', organizer: 'text' });
