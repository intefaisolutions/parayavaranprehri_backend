import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { TreesModule } from '../trees/trees.module';
import { PersonsModule } from '../persons/persons.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PendingAction, PendingActionSchema } from './schemas/pending-action.schema';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import { PendingActionsService } from './pending-actions.service';
import { ChatHistoryService } from './chat-history.service';
import { FieldIssuesModule } from '../field-issues/field-issues.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PendingAction.name, schema: PendingActionSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    KnowledgeBaseModule,
    TreesModule,
    PersonsModule,
    CertificatesModule,
    FieldIssuesModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, PendingActionsService, ChatHistoryService],
})
export class ChatbotModule {}
