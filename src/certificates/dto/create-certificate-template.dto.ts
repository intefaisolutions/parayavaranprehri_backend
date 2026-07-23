import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CertificateTemplateStatus } from '../schemas/certificate-template.schema';

export class CreateCertificateTemplateDto {
  @IsString()
  @IsNotEmpty()
  certificateType!: string;

  @IsString()
  @IsNotEmpty()
  templateName!: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @IsString()
  @IsOptional()
  backgroundUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CertificateTemplateStatus)
  @IsOptional()
  status?: CertificateTemplateStatus;

  @IsString()
  @IsOptional()
  lastUpdatedBy?: string;
}
