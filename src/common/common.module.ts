import { Global, Module } from '@nestjs/common';
import { WhatsappService } from './services/whatsapp.service';
import { S3UploadService } from './services/s3-upload.service';

@Global()
@Module({
  providers: [WhatsappService, S3UploadService],
  exports: [WhatsappService, S3UploadService],
})
export class CommonModule {}
