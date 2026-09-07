import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlantationRequestDto {
  @IsString()
  @IsNotEmpty()
  insuranceId!: string;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;
}
