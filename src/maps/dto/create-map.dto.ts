import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MapStatus } from '../schemas/map.schema';

export class CreateMapDto {
  @IsString()
  @IsNotEmpty()
  locationName!: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  treeCount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  plantationArea?: string;

  @IsString()
  @IsOptional()
  addedBy?: string;

  @IsEnum(MapStatus)
  @IsOptional()
  status?: MapStatus;
}
