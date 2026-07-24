import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LocationStatus, LocationType } from '../schemas/location.schema';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  locationName!: string;

  @IsEnum(LocationType)
  locationType!: LocationType;

  @IsString()
  @IsOptional()
  parentLocation?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  totalLinkedRecords?: number;

  @IsEnum(LocationStatus)
  @IsOptional()
  status?: LocationStatus;
}
