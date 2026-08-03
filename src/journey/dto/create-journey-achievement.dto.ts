import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { AchievementType } from '../schemas/journey-achievement.schema';

export class CreateJourneyAchievementDto {
  @IsString()
  @IsNotEmpty()
  year!: string;

  @IsEnum(AchievementType)
  type!: AchievementType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  subtitle!: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
