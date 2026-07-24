import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  NotificationAudience,
  NotificationLocationFilter,
  NotificationStatus,
  NotificationType,
} from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  notificationTitle!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsEnum(NotificationType)
  @IsOptional()
  notificationType?: NotificationType;

  @IsEnum(NotificationAudience)
  @IsOptional()
  targetAudience?: NotificationAudience;

  @IsEnum(NotificationLocationFilter)
  @IsOptional()
  locationFilter?: NotificationLocationFilter;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  sentBy?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  deliveryCount?: number;
}
