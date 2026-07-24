import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VidhanSabhaStatus } from '../schemas/vidhan-sabha.schema';

export class CreateVidhanSabhaDto {
  @IsString()
  @IsNotEmpty()
  vidhanSabhaName!: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  totalPersons?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  totalVehicles?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  totalTrees?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  totalMitras?: number;

  @IsString()
  @IsOptional()
  assignedAdmin?: string;

  @IsEnum(VidhanSabhaStatus)
  @IsOptional()
  status?: VidhanSabhaStatus;
}
