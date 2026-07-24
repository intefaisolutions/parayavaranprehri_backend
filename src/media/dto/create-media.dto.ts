import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MediaStatus, MediaType, MediaUsageModule } from '../schemas/media.schema';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MediaType)
  @IsNotEmpty()
  mediaType!: MediaType;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  fileSize?: string;

  @IsString()
  @IsOptional()
  uploadedBy?: string;

  @IsEnum(MediaUsageModule)
  @IsOptional()
  usedInModule?: MediaUsageModule;

  @IsEnum(MediaStatus)
  @IsOptional()
  status?: MediaStatus;
}
