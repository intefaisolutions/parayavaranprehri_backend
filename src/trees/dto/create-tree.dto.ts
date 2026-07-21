import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTreeDto {
  @IsString()
  @IsNotEmpty()
  treeName!: string;

  @IsString()
  @IsOptional()
  species?: string;

  @IsString()
  @IsOptional()
  scientificName?: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsEnum(['ACTIVE', 'EXPIRED', 'NOT_INSURED'])
  @IsOptional()
  insuranceStatus?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  plantedDate?: Date;

  @IsString()
  @IsOptional()
  plantedBy?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsEnum(['PLANTED', 'HEALTHY', 'GROWING', 'DAMAGED', 'DEAD'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
