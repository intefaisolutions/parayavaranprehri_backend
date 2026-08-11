import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class VehicleOtpRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  plate!: string;
}

export class VehicleOtpVerifyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  plate!: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  code!: string;
}
