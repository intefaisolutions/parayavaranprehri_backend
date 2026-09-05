import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PendingActionDocument = HydratedDocument<PendingAction>;

export enum PendingActionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true, collection: 'pending_actions' })
export class PendingAction extends BaseSchema {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ required: true })
  actionType!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;

  @Prop({ enum: PendingActionStatus, default: PendingActionStatus.PENDING })
  status!: PendingActionStatus;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;
}

export const PendingActionSchema = SchemaFactory.createForClass(PendingAction);

// Automatically expire documents using MongoDB TTL index
PendingActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
