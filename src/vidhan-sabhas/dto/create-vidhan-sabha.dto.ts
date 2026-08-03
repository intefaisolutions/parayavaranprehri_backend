import { Type } from 'class-transformer';
import {
  Allow,
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
  country?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  state?: string;

  /**
   * Geo boundary: full GeoJSON Polygon/MultiPolygon, OR a simple ring
   * [[lng,lat], ...] which is converted to a Polygon server-side.
   */
  @IsOptional()
  @Allow()
  boundary?: unknown;

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
