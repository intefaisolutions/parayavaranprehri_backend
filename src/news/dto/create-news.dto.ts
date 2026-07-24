import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { NewsCategory, NewsStatus } from '../schemas/news.schema';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(NewsCategory)
  @IsNotEmpty()
  category!: NewsCategory;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @Type(() => String)
  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  views?: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  tags?: string[];

  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus;
}
