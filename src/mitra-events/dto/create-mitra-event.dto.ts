import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventType } from '../schemas/mitra-event.schema';

export class OfflineDetailsDto {
  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class OnlineDetailsDto {
  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsString()
  @IsOptional()
  meetingId?: string;

  @IsString()
  @IsOptional()
  passcode?: string;
}

export class CreateMitraEventDto {
  @IsEnum(EventType)
  @IsNotEmpty()
  eventType!: EventType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @Type(() => String)
  @IsDateString()
  date!: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => OfflineDetailsDto)
  @IsOptional()
  offlineDetails?: OfflineDetailsDto;

  @ValidateNested()
  @Type(() => OnlineDetailsDto)
  @IsOptional()
  onlineDetails?: OnlineDetailsDto;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsBoolean()
  @IsOptional()
  registrationRequired?: boolean;

  @Type(() => Date)
  @IsOptional()
  registrationDeadline?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
