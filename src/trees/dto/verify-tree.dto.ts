import { IsOptional, IsString } from 'class-validator';

export class VerifyTreeDto {
  @IsOptional()
  @IsString()
  status?: 'HEALTHY' | 'GROWING' | 'PLANTED' | 'DAMAGED' | 'DEAD';

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
