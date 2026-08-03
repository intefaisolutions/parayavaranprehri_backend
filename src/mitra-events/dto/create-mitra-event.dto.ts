import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMitraEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Type(() => String)
  @IsDateString()
  date!: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
