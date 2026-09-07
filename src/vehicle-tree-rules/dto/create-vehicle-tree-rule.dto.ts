import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateVehicleTreeRuleDto {
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  treesRequired!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxUserSuggestions?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
