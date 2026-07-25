import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { LanguageStatus } from '../schemas/language.schema';

export class LanguageQueryDto {
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

  @IsEnum(LanguageStatus)
  @IsOptional()
  status?: LanguageStatus;
}
