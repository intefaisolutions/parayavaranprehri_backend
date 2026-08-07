import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRashiPlantRequestDto {
  @IsString()
  rashiName!: string;

  @IsOptional()
  @IsString()
  rashiNameHindi?: string;

  @IsString()
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
}
