import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationReadDocument = HydratedDocument<NotificationRead>;

@Schema({ timestamps: true, collection: 'notification_reads' })
export class NotificationRead {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Notification' })
  notificationId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  readAt!: Date;
}

export const NotificationReadSchema =
  SchemaFactory.createForClass(NotificationRead);

NotificationReadSchema.index(
  { userId: 1, notificationId: 1 },
  { unique: true },
);
