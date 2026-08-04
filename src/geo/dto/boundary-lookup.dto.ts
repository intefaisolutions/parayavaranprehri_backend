import { IsOptional, IsString } from 'class-validator';

export class BoundaryLookupDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  /** Vidhan Sabha / place name */
  @IsOptional()
  @IsString()
  name?: string;
}
