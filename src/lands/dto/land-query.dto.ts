import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LandOwnershipType, LandStatus } from '../schemas/land.schema';

export class LandQueryDto {
  @IsOptional()
  @IsEnum(LandOwnershipType)
  ownershipType?: LandOwnershipType;

  @IsOptional()
  @IsEnum(LandStatus)
  status?: LandStatus;

  @IsOptional()
  @IsString()
  vidhanSabha?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
