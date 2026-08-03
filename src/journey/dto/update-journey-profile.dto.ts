import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

class JourneyStatDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

export class UpdateJourneyProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsUrl()
  @IsOptional()
  photo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JourneyStatDto)
  @ArrayMaxSize(20)
  @IsOptional()
  stats?: JourneyStatDto[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  inspirationText?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
