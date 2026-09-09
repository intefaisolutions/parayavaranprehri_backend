import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobile!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  syncType?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsOptional()
  location?: {
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  @IsOptional()
  customData?: Record<string, unknown>;
}

