import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FieldIssueStatus } from '../schemas/field-issue.schema';

export class UpdateFieldIssueStatusDto {
  @IsEnum(FieldIssueStatus)
  status!: FieldIssueStatus;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
