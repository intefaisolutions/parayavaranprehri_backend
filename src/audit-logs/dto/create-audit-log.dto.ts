import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  @IsOptional()
  userName?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsNotEmpty()
  moduleName!: string;

  @IsString()
  @IsNotEmpty()
  actionType!: string;

  @IsString()
  @IsOptional()
  recordId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsDateString()
  @IsOptional()
  dateTime?: string;
}
