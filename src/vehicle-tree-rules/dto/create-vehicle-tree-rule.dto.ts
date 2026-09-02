import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateVehicleTreeRuleDto {
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  treesRequired!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
