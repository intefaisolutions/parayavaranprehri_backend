import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  ChatSession,
  ChatSessionDocument,
  ChatSessionStatus,
} from './schemas/chat-session.schema';
import {
  ChatMessage,
  ChatMessageDocument,
  ChatMessageRole,
} from './schemas/chat-message.schema';

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectModel(ChatSession.name)
    private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  async createSession(userId: string): Promise<ChatSession> {
    // Session expires after 7 days of inactivity
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = new this.chatSessionModel({
      userId,
      sessionId: randomUUID(),
      expiresAt,
    });
    return session.save();
  }

  async validateAndGetSession(
    sessionId: string,
    userId: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionModel
      .findOne({ sessionId })
      .exec();

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session.',
      );
    }

    if (session.status !== ChatSessionStatus.ACTIVE) {
      throw new NotFoundException('Session is closed or expired.');
    }

    // Bump expiration
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return session.save();
  }

  async saveMessage(
    sessionId: string,
    role: ChatMessageRole,
    content: string,
    toolCalls?: any[],
    toolCallId?: string,
    name?: string,
  ): Promise<ChatMessage> {
    const msg = new this.chatMessageModel({
      sessionId,
      role,
      content,
      toolCalls,
      toolCallId,
      name,
    });
    return msg.save();
  }

  /**
   * Fetches max 20 recent messages. In a real system, you'd loop
   * and count tokens to hit a specific token budget.
   */
  async getBoundedHistory(sessionId: string): Promise<any[]> {
    const messages = await this.chatMessageModel
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    // They come out newest-first. Reverse them for chronological order to send to OpenAI.
    messages.reverse();

    // Map DB objects to OpenAI compatible structure
    return messages.map((m) => {
      const msg: any = { role: m.role };
      if (m.content) msg.content = m.content;
      if (m.toolCalls && m.toolCalls.length > 0) msg.tool_calls = m.toolCalls;
      if (m.toolCallId) msg.tool_call_id = m.toolCallId;
      if (m.name) msg.name = m.name;
      return msg;
    });
  }

  async getSessionsByUser(userId: string): Promise<ChatSession[]> {
    return this.chatSessionModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getSessionHistory(
    sessionId: string,
    userId: string,
  ): Promise<ChatMessage[]> {
    // Validate ownership first
    await this.validateAndGetSession(sessionId, userId);
    return this.chatMessageModel
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .exec();
  }
}
