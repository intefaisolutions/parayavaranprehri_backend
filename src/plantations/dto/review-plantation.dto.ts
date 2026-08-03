import { IsIn, IsOptional, IsString } from 'class-validator';
import { PlantationStatus } from '../schemas/plantation.schema';

export class ReviewPlantationDto {
  @IsIn([
    PlantationStatus.APPROVED,
    PlantationStatus.REJECTED,
    PlantationStatus.PLANTED,
  ])
  status!: PlantationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}
