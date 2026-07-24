import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {} from 'multer';
import {
  S3UploadService,
  UploadCategory,
} from '../common/services/s3-upload.service';

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

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload an image/PDF to S3 under paryavaran/<category>/ and get back a public URL',
  })
  @UseInterceptors(FileInterceptor('file'))
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
}
