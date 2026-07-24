import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import {
  PersonIdentityStatus,
  VehicleStickerStatus,
} from '../schemas/person-identity.schema';

export class PersonIdentityQueryDto {
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

  @IsEnum(PersonIdentityStatus)
  @IsOptional()
  status?: PersonIdentityStatus;

  @IsEnum(VehicleStickerStatus)
  @IsOptional()
  vehicleStickerStatus?: VehicleStickerStatus;
}
