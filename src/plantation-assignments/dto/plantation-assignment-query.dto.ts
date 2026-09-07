import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PlantationRequestStatus } from '../schemas/plantation-request.schema';

export class PlantationAssignmentQueryDto {
  @IsEnum(PlantationRequestStatus)
  @IsOptional()
  status?: PlantationRequestStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
