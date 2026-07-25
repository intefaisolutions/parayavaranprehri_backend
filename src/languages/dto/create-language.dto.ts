import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { LanguageStatus } from '../schemas/language.schema';

export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty()
  languageName!: string;

  @IsString()
  @IsNotEmpty()
  languageCode!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  translationProgress?: number;

  @IsEnum(LanguageStatus)
  @IsOptional()
  status?: LanguageStatus;
}
