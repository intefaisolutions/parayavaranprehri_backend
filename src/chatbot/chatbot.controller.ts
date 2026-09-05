import { Body, Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatbotService } from './chatbot.service';
import { ChatHistoryService } from './chat-history.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@Controller({ path: 'chat', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly chatHistoryService: ChatHistoryService,
  ) {}

  @Post()
  async handleChat(
    @Body() chatRequest: ChatRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatbotService.processChatRequest(
      chatRequest,
      user,
    );
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: JwtPayload) {
    if (!user.sub) return [];
    return this.chatHistoryService.getSessionsByUser(user.sub);
  }

  @Get('history/:sessionId')
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.sub) return [];
    return this.chatHistoryService.getSessionHistory(
      sessionId,
      user.sub,
    );
  }

  @Post('actions/:pendingActionId/confirm')
  async confirmAction(
    @Param('pendingActionId') pendingActionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatbotService.confirmPendingAction(pendingActionId, user);
  }

  @Post('actions/:pendingActionId/cancel')
  async cancelAction(
    @Param('pendingActionId') pendingActionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatbotService.cancelPendingAction(pendingActionId, user);
  }
}
