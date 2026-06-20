import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLandOfferDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsString()
  @IsNotEmpty()
  availableArea!: string;

  @IsString()
  @IsNotEmpty()
  landSize!: string;
}
