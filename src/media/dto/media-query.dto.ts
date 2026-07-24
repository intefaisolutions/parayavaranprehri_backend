import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { MediaStatus, MediaType, MediaUsageModule } from '../schemas/media.schema';

export class MediaQueryDto {
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

  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsEnum(MediaUsageModule)
  @IsOptional()
  usedInModule?: MediaUsageModule;

  @IsEnum(MediaStatus)
  @IsOptional()
  status?: MediaStatus;
}
