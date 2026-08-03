import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  GrowthRate,
  TreeAvailability,
  WaterRequirement,
} from '../schemas/tree-master.schema';

export class CreateTreeMasterDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedLifespanYears?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oxygenRateKgPerYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  co2RateKgPerYear?: number;

  @IsOptional()
  @IsEnum(WaterRequirement)
  waterRequirement?: WaterRequirement;

  @IsOptional()
  @IsEnum(GrowthRate)
  growthRate?: GrowthRate;

  @IsOptional()
  @IsString()
  suitableClimate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(TreeAvailability)
  availability?: TreeAvailability;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  displayOrder?: number;
}
