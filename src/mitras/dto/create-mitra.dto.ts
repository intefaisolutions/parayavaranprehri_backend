import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MitraMembership, MitraStatus } from '../schemas/mitra.schema';

export class CreateMitraDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  vidhanSabha?: string;

  @IsString()
  @IsOptional()
  assignedZone?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsEnum(MitraMembership)
  @IsOptional()
  membership?: MitraMembership;

  @IsEnum(MitraStatus)
  @IsOptional()
  status?: MitraStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  treesPlanted?: number;

  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @IsString()
  @IsOptional()
  remarks?: string;
}
