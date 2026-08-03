import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { MaintenanceActivity } from '../schemas/maintenance-log.schema';

export class CreateMaintenanceLogDto {
  @IsString()
  @IsNotEmpty()
  treeCode!: string;

  @IsEnum(MaintenanceActivity)
  activity!: MaintenanceActivity;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  mitraId?: string;

  @IsDateString()
  @IsOptional()
  loggedAt?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  photoUrls?: string[];
}
