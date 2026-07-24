import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import {
  CallCenterContactStatus,
  CallCenterContactType,
} from '../schemas/call-center.schema';

export class CallCenterQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(CallCenterContactStatus)
  @IsOptional()
  status?: CallCenterContactStatus;

  @IsEnum(CallCenterContactType)
  @IsOptional()
  contactType?: CallCenterContactType;
}
