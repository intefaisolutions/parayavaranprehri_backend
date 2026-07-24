import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationRepository } from './repositories/notification.repository';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const data: Partial<NotificationDocument> = {
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    } as Partial<NotificationDocument>;

    if (dto.status === NotificationStatus.SENT) {
      data.sentAt = new Date();
    }

    return this.notificationRepository.create(data);
  }

  async findAll(
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status) {
      baseFilter.status = query.status;
    }
    if (query.targetAudience) {
      baseFilter.targetAudience = query.targetAudience;
    }

    return this.notificationRepository.findPaginated(options, baseFilter, [
      'notificationTitle',
      'message',
      'sentBy',
    ]);
  }

  async findOne(id: string): Promise<Notification> {
    const entry = await this.notificationRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    const data: Partial<NotificationDocument> = {
      ...dto,
    } as Partial<NotificationDocument>;

    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }
    if (dto.status === NotificationStatus.SENT) {
      data.sentAt = new Date();
    }

    const updated = await this.notificationRepository.updateById(id, data);
    if (!updated) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    return updated;
  }

  async send(id: string): Promise<Notification> {
    const updated = await this.notificationRepository.updateById(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    } as Partial<NotificationDocument>);
    if (!updated) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.notificationRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
  }
}
