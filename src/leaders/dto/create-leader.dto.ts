import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLeaderDto {
  @IsString()
  @IsNotEmpty()
  leaderName!: string;

  @IsString()
  @IsNotEmpty()
  designation!: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
