import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRashiPlantRequestDto {
  @IsString()
  @IsNotEmpty()
  rashiName!: string;

  @IsOptional()
  @IsString()
  rashiNameHindi?: string;

  @IsString()
  @IsNotEmpty()
  recommendedTree!: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  localName?: string;

  @IsOptional()
  @IsString()
  treeDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsString()
  remarks?: string;

  /** Basic user details (required for admin review when called without JWT) */
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
