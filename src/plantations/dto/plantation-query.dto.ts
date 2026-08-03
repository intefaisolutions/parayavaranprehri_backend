import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlantationStatus } from '../schemas/plantation.schema';

export class PlantationQueryDto {
  @IsOptional()
  @IsEnum(PlantationStatus)
  status?: PlantationStatus;

  @IsOptional()
  @IsString()
  treeMasterId?: string;

  @IsOptional()
  @IsString()
  landId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
