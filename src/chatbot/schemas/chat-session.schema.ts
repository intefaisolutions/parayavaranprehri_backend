import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

export enum ChatSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true, collection: 'chat_sessions' })
export class ChatSession extends BaseSchema {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ enum: ChatSessionStatus, default: ChatSessionStatus.ACTIVE })
  status!: ChatSessionStatus;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

// Indexes
ChatSessionSchema.index({ userId: 1, updatedAt: -1 });
ChatSessionSchema.index({ sessionId: 1 }, { unique: true });
ChatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
