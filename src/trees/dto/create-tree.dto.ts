import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDate, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTreeDto {
  @IsString()
  @IsNotEmpty()
  treeName!: string;

  @IsMongoId()
  @IsOptional()
  personId?: string;

  @IsMongoId()
  @IsOptional()
  landId?: string;

  @IsString()
  @IsOptional()
  landName?: string;

  @IsEnum(['INDIVIDUAL', 'PLANTATION_DRIVE', 'CSR', 'GOVERNMENT_SCHEME'])
  @IsOptional()
  plantationMethod?: string;

  @IsString()
  @IsOptional()
  responsibleOrganization?: string;

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

  /** Optional Mitra (volunteer) who planted / cares for this tree */
  @IsMongoId()
  @IsOptional()
  assignedMitraId?: string;

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

  /** Trunk diameter at breast height in cm (optional, improves O₂ accuracy). */
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dbh?: number;

  @IsString()
  @IsOptional()
  vidhanSabha?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
