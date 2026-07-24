import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PartnerStatus, PartnerType } from '../schemas/partner.schema';

export class PartnerQueryDto {
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

  @IsEnum(PartnerStatus)
  @IsOptional()
  status?: PartnerStatus;

  @IsEnum(PartnerType)
  @IsOptional()
  partnerType?: PartnerType;
}
