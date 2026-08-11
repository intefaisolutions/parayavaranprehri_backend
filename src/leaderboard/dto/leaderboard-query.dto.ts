import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsIn(['vidhan-sabha', 'city', 'state'])
  scope?: 'vidhan-sabha' | 'city' | 'state';

  /** Optional constituency filter when scope=vidhan-sabha */
  @IsOptional()
  @IsString()
  vidhanSabha?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn(['month', 'year'])
  period?: 'month' | 'year';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
