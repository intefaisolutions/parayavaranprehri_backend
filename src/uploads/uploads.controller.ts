import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {} from 'multer';
import { Public } from '../common/decorators/public.decorator';
import {
  S3UploadService,
  UploadCategory,
} from '../common/services/s3-upload.service';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';

const VALID_CATEGORIES: UploadCategory[] = [
  'users',
  'certificates',
  'trees',
  'documents',
  'general',
];

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller({ path: 'uploads', version: '1' })
export class UploadsController {
  constructor(private readonly s3UploadService: S3UploadService) {}

  @Public()
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload an image/PDF to S3. Returns permanent `url` (store in DB) and temporary `signedUrl` (use for preview).',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Attach it as "file".');
    }

    const resolvedCategory: UploadCategory = VALID_CATEGORIES.includes(
      category as UploadCategory,
    )
      ? (category as UploadCategory)
      : 'general';

    return this.s3UploadService.uploadFile(file, resolvedCategory);
  }

  @Public()
  @Get('signed')
  @ApiOperation({
    summary:
      'Get a temporary signed URL so a private S3 object can be previewed (app / admin)',
  })
  async signed(@Query('url') url?: string, @Query('key') key?: string) {
    const target = url || key;
    if (!target) {
      throw new BadRequestException('Provide either "url" or "key" query param');
    }
    const signedUrl = await this.s3UploadService.getSignedGetUrl(target);
    return { signedUrl };
  }

  @Public()
  @Post('presigned-url')
  @ApiOperation({
    summary:
      'Generate an AWS S3 Presigned PUT URL for direct client-side upload of videos/large files.',
  })
  async presignedUrl(@Body() dto: CreatePresignedUrlDto) {
    const category: UploadCategory = VALID_CATEGORIES.includes(
      dto.category as UploadCategory,
    )
      ? (dto.category as UploadCategory)
      : 'general';

    return this.s3UploadService.createPresignedUrl(
      dto.fileName,
      dto.contentType,
      category,
    );
  }
}
