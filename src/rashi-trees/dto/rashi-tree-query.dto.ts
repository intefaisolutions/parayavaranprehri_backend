import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class RashiTreeQueryDto {
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

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
