import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
} from './schemas/notification.schema';
import {
  NotificationRead,
  NotificationReadDocument,
} from './schemas/notification-read.schema';

export type InboxNotificationItem = {
  _id: string;
  notificationTitle: string;
  message: string;
  notificationType?: string;
  targetAudience?: string;
  status: string;
  sentAt?: Date | null;
  createdAt?: Date;
  isRead: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly dispatchService: NotificationDispatchService,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRead.name)
    private readonly readModel: Model<NotificationReadDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const data: Partial<NotificationDocument> = {
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    } as Partial<NotificationDocument>;

    const created = await this.notificationRepository.create(data);

    if (dto.status === NotificationStatus.SENT) {
      return this.dispatchAndPersist(String(created._id), created);
    }

    return created;
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
    const entry = await this.notificationRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    return this.dispatchAndPersist(id, entry);
  }

  private async dispatchAndPersist(
    id: string,
    notification: Notification,
  ): Promise<Notification> {
    const result = await this.dispatchService.dispatch(notification);

    const updated = await this.notificationRepository.updateById(id, {
      status:
        result.delivered > 0
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
      sentAt: new Date(),
      deliveryCount: result.delivered,
      failureReason: result.failureReason,
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

  async getInbox(
    userId: string,
    limit = 50,
  ): Promise<{ items: InboxNotificationItem[]; unreadCount: number }> {
    const sent = await this.notificationModel
      .find({
        isDeleted: false,
        status: NotificationStatus.SENT,
      })
      .sort({ sentAt: -1, createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 100))
      .lean()
      .exec();

    const ids = sent.map((n) => n._id);
    const reads = await this.readModel
      .find({
        userId: new Types.ObjectId(userId),
        notificationId: { $in: ids },
      })
      .lean()
      .exec();
    const readSet = new Set(reads.map((r) => String(r.notificationId)));

    const items: InboxNotificationItem[] = sent.map((n) => ({
      _id: String(n._id),
      notificationTitle: n.notificationTitle,
      message: n.message,
      notificationType: n.notificationType,
      targetAudience: n.targetAudience,
      status: n.status,
      sentAt: n.sentAt,
      createdAt: (n as any).createdAt,
      isRead: readSet.has(String(n._id)),
    }));

    return {
      items,
      unreadCount: items.filter((i) => !i.isRead).length,
    };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const sent = await this.notificationModel
      .find({ isDeleted: false, status: NotificationStatus.SENT })
      .select('_id')
      .lean()
      .exec();
    if (sent.length === 0) return { unreadCount: 0 };

    const readCount = await this.readModel.countDocuments({
      userId: new Types.ObjectId(userId),
      notificationId: { $in: sent.map((n) => n._id) },
    });
    return { unreadCount: Math.max(0, sent.length - readCount) };
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<{ ok: true }> {
    const exists = await this.notificationModel
      .findOne({
        _id: notificationId,
        isDeleted: false,
        status: NotificationStatus.SENT,
      })
      .select('_id')
      .lean()
      .exec();
    if (!exists) {
      throw new NotFoundException(`Notification "${notificationId}" not found`);
    }

    await this.readModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        notificationId: new Types.ObjectId(notificationId),
      },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          notificationId: new Types.ObjectId(notificationId),
          readAt: new Date(),
        },
      },
      { upsert: true },
    );
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ marked: number }> {
    const sent = await this.notificationModel
      .find({ isDeleted: false, status: NotificationStatus.SENT })
      .select('_id')
      .lean()
      .exec();
    if (sent.length === 0) return { marked: 0 };

    const ops = sent.map((n) => ({
      updateOne: {
        filter: {
          userId: new Types.ObjectId(userId),
          notificationId: n._id,
        },
        update: {
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
            notificationId: n._id,
            readAt: new Date(),
          },
        },
        upsert: true,
      },
    }));
    const result = await this.readModel.bulkWrite(ops, { ordered: false });
    return {
      marked: (result.upsertedCount || 0) + (result.modifiedCount || 0),
    };
  }
}
