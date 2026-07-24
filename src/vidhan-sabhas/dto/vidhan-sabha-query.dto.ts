import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { VidhanSabhaStatus } from '../schemas/vidhan-sabha.schema';

export class VidhanSabhaQueryDto {
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

  @IsString()
  @IsOptional()
  district?: string;

  @IsEnum(VidhanSabhaStatus)
  @IsOptional()
  status?: VidhanSabhaStatus;
}
