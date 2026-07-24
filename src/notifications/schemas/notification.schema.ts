import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
}

export enum NotificationAudience {
  ALL_USERS = 'All Users',
  CUSTOMERS = 'Customers',
  EMPLOYEES = 'Employees',
  PARTNERS = 'Partners',
  SPECIFIC_GROUP = 'Specific Group',
}

export enum NotificationLocationFilter {
  ALL_LOCATIONS = 'All Locations',
  STATE_WISE = 'State Wise',
  CITY_WISE = 'City Wise',
  ZONE_WISE = 'Zone Wise',
}

export enum NotificationStatus {
  DRAFT = 'Draft',
  SCHEDULED = 'Scheduled',
  SENT = 'Sent',
  FAILED = 'Failed',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends BaseSchema {
  @Prop({ required: true, trim: true })
  notificationTitle!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ enum: NotificationType, default: NotificationType.PUSH })
  notificationType!: NotificationType;

  @Prop({ enum: NotificationAudience, default: NotificationAudience.ALL_USERS })
  targetAudience!: NotificationAudience;

  @Prop({
    enum: NotificationLocationFilter,
    default: NotificationLocationFilter.ALL_LOCATIONS,
  })
  locationFilter!: NotificationLocationFilter;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.DRAFT, index: true })
  status!: NotificationStatus;

  @Prop({ type: Date, default: null })
  scheduledAt!: Date | null;

  @Prop({ type: Date, default: null })
  sentAt!: Date | null;

  @Prop({ trim: true })
  sentBy?: string;

  @Prop({ default: 0 })
  deliveryCount!: number;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({
  notificationTitle: 'text',
  message: 'text',
  sentBy: 'text',
});
