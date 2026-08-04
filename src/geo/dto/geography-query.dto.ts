import { IsOptional, IsString } from 'class-validator';

export class StatesQueryDto {
  @IsOptional()
  @IsString()
  country?: string;
}

export class DistrictsQueryDto {
  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class ConstituenciesQueryDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
