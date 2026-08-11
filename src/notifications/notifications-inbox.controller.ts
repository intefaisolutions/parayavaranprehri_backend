import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

/**
 * Citizen / any authenticated user inbox.
 * Kept in a separate controller so these routes never share admin
 * @Permissions() metadata and cannot collide with GET /notifications/:id.
 */
@ApiTags('Notifications Inbox')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'notifications/inbox', version: '1' })
export class NotificationsInboxController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'My notification inbox (Sent broadcasts + read state)',
  })
  getInbox(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? Number(limit) : 50;
    return this.notificationsService.getInbox(
      user.sub,
      Number.isFinite(n) ? n : 50,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count for the current user' })
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all inbox notifications as read' })
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one inbox notification as read' })
  markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }
}
