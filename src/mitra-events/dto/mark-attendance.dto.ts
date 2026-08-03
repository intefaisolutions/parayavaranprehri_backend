import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '../schemas/mitra-event-attendance.schema';

export class MarkAttendanceDto {
  @IsString()
  @IsOptional()
  mitraId?: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
