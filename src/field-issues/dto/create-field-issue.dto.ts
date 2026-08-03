import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  FieldIssuePriority,
  FieldIssueType,
} from '../schemas/field-issue.schema';

export class CreateFieldIssueDto {
  @IsEnum(FieldIssueType)
  type!: FieldIssueType;

  @IsEnum(FieldIssuePriority)
  @IsOptional()
  priority?: FieldIssuePriority;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  treeCode?: string;

  @IsString()
  @IsOptional()
  mitraId?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  photoUrls?: string[];
}
