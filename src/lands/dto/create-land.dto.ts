import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  LandAreaUnit,
  LandOwnershipType,
  LandStatus,
} from '../schemas/land.schema';

export class CreateLandDto {
  @IsString()
  landName!: string;

  @IsEnum(LandOwnershipType)
  ownershipType!: LandOwnershipType;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  tehsil?: string;

  @IsOptional()
  @IsString()
  villageOrCity?: string;

  /** Legacy alias — maps to villageOrCity */
  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  landAddress?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @IsString()
  khasraNumber?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalArea!: number;

  @IsEnum(LandAreaUnit)
  areaUnit!: LandAreaUnit;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxTreeCapacity?: number;

  @IsOptional()
  @IsBoolean()
  maxCapacityManual?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(LandStatus)
  status?: LandStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
