import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RashiPlantRequestStatus } from '../schemas/rashi-plant-request.schema';

export class ReviewRashiPlantRequestDto {
  @IsEnum(RashiPlantRequestStatus)
  status!: RashiPlantRequestStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
