import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import {
  ReportFileType,
  ReportStatus,
  ReportType,
} from '../schemas/report.schema';

export class ReportQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ReportType)
  @IsOptional()
  reportType?: ReportType;

  @IsEnum(ReportFileType)
  @IsOptional()
  fileType?: ReportFileType;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
