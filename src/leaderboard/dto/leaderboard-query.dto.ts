import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsIn(['vidhan-sabha', 'city', 'state'])
  scope?: 'vidhan-sabha' | 'city' | 'state';

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
