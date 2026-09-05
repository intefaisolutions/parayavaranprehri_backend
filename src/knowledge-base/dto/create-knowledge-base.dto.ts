import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  KnowledgeBaseLanguage,
  KnowledgeBaseStatus,
} from '../schemas/knowledge-base.schema';

export class CreateKnowledgeBaseDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsEnum(KnowledgeBaseLanguage)
  @IsOptional()
  language?: KnowledgeBaseLanguage;

  @IsEnum(KnowledgeBaseStatus)
  @IsOptional()
  status?: KnowledgeBaseStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;
}
