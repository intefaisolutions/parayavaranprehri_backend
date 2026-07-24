import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { NewsCategory, NewsStatus } from '../schemas/news.schema';

export class NewsQueryDto {
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

  @IsEnum(NewsCategory)
  @IsOptional()
  category?: NewsCategory;

  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus;
}
