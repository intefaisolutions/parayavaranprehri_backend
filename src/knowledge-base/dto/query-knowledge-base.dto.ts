import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  KnowledgeBaseLanguage,
  KnowledgeBaseStatus,
} from '../schemas/knowledge-base.schema';

export class QueryKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(KnowledgeBaseLanguage)
  language?: KnowledgeBaseLanguage;

  @IsOptional()
  @IsEnum(KnowledgeBaseStatus)
  status?: KnowledgeBaseStatus;

  @IsOptional()
  @IsString()
  sortBy?: string; // e.g. 'createdAt', 'priority'

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
