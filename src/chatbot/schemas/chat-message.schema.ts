import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage extends BaseSchema {
  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ enum: ChatMessageRole, required: true })
  role!: ChatMessageRole;

  @Prop({ type: String })
  content!: string;

  // For tracking tool calls (function names and raw arguments)
  @Prop({ type: [Object], default: undefined })
  toolCalls?: Record<string, any>[];

  // For tracking tool results
  @Prop({ type: String })
  toolCallId?: string;

  @Prop({ type: String })
  name?: string; // used for tool/function response name
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
