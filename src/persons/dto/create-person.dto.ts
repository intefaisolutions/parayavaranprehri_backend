import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  PersonGender,
  PersonIdProofType,
  PersonStatus,
} from '../schemas/person.schema';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dob?: Date;

  @IsEnum(PersonGender)
  @IsOptional()
  gender?: PersonGender;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsEnum(PersonIdProofType)
  @IsOptional()
  idProofType?: PersonIdProofType;

  @IsString()
  @IsOptional()
  idProofNumber?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  vehiclesLinked?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  treesAssigned?: number;

  @IsEnum(PersonStatus)
  @IsOptional()
  status?: PersonStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  registrationDate?: Date;
}
