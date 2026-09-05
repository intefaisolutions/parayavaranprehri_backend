import { Body, Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatbotService } from './chatbot.service';
import { ChatHistoryService } from './chat-history.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@Controller('api/chat')
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
    const result = await this.chatbotService.processChatRequest(
      chatRequest,
      user,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: JwtPayload) {
    if (!user.sub) return [];
    const sessions = await this.chatHistoryService.getSessionsByUser(user.sub);
    return {
      success: true,
      data: sessions,
    };
  }

  @Get('history/:sessionId')
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.sub) return [];
    const history = await this.chatHistoryService.getSessionHistory(
      sessionId,
      user.sub,
    );
    return {
      success: true,
      data: history,
    };
  }

  @Post('actions/:pendingActionId/confirm')
  async confirmAction(
    @Param('pendingActionId') pendingActionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.chatbotService.confirmPendingAction(pendingActionId, user);
    return { success: true, data: result };
  }

  @Post('actions/:pendingActionId/cancel')
  async cancelAction(
    @Param('pendingActionId') pendingActionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.chatbotService.cancelPendingAction(pendingActionId, user);
    return { success: true, data: result };
  }
}
