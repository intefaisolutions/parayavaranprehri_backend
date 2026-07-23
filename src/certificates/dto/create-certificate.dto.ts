import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  CertificateRecipientType,
  CertificateStatus,
} from '../schemas/certificate.schema';

export class CreateCertificateDto {
  @IsMongoId()
  @IsNotEmpty()
  templateId!: string;

  @IsEnum(CertificateRecipientType)
  @IsOptional()
  recipientType?: CertificateRecipientType;

  // Mitra ID (e.g. PM-000001) when recipientType is MITRA, or User ID otherwise
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  // Required when recipientType is USER; auto-filled from Mitra record when MITRA
  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientMobile?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  eventName?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  issueDate?: Date;

  @IsString()
  @IsOptional()
  issuedBy?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  treesPlanted?: number;

  @IsEnum(CertificateStatus)
  @IsOptional()
  status?: CertificateStatus;
}
