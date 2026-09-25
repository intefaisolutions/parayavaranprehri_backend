import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UploadCategory } from '../../common/services/s3-upload.service';

export class CreatePresignedUrlDto {
  @ApiProperty({ example: 'concept-video.mp4', description: 'Name of the file' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'video/mp4', description: 'MIME content type of the file' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiPropertyOptional({ example: 'general', description: 'Category folder in S3' })
  @IsString()
  @IsOptional()
  category?: UploadCategory;
}
