import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  PersonIdentityStatus,
  VehicleStickerStatus,
} from '../schemas/person-identity.schema';

export class CreatePersonIdentityDto {
  @IsMongoId()
  @IsOptional()
  person?: string;

  @IsString()
  @IsNotEmpty()
  personName!: string;

  @IsString()
  @IsOptional()
  personMobile?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsEnum(VehicleStickerStatus)
  @IsOptional()
  vehicleStickerStatus?: VehicleStickerStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  generatedDate?: Date;

  @IsEnum(PersonIdentityStatus)
  @IsOptional()
  status?: PersonIdentityStatus;
}
