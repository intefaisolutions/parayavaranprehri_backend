import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRashiTreeDto {
  @IsString()
  @IsNotEmpty()
  rashiName!: string;

  @IsString()
  @IsNotEmpty()
  rashiNameHindi!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  zodiacNumber!: number;

  @IsString()
  @IsNotEmpty()
  recommendedTree!: string;

  @IsString()
  @IsOptional()
  scientificName?: string;

  @IsString()
  @IsOptional()
  localName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  benefits?: string[];

  @IsString()
  @IsOptional()
  careInstructions?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  galleryImages?: string[];

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
