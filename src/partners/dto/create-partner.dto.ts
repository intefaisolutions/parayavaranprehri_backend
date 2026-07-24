import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartnerStatus, PartnerType } from '../schemas/partner.schema';

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  partnerName!: string;

  @IsEnum(PartnerType)
  @IsNotEmpty()
  partnerType!: PartnerType;

  @IsString()
  @IsNotEmpty()
  contactPerson!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsEnum(PartnerStatus)
  @IsOptional()
  status?: PartnerStatus;
}
