import { Module } from '@nestjs/common';
import { VidhanSabhasController } from './vidhan-sabhas.controller';
import { VidhanSabhasService } from './vidhan-sabhas.service';

@Module({
  controllers: [VidhanSabhasController],
  providers: [VidhanSabhasService],
})
export class VidhanSabhasModule {}
