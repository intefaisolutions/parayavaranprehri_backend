import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ReportFileType,
  ReportStatus,
  ReportType,
} from '../schemas/report.schema';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  reportName!: string;

  @IsEnum(ReportType)
  reportType!: ReportType;

  @IsString()
  @IsNotEmpty()
  generatedBy!: string;

  @IsString()
  @IsOptional()
  locationFilter?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(ReportFileType)
  fileType!: ReportFileType;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
