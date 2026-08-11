import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plate!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  vhId?: string;

  @IsString()
  @IsNotEmpty()
  fuel!: string;

  @IsString()
  @IsOptional()
  insuranceId?: string;
}
