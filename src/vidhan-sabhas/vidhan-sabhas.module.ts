import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VidhanSabhaRepository } from './repositories/vidhan-sabha.repository';
import {
  VidhanSabha,
  VidhanSabhaSchema,
} from './schemas/vidhan-sabha.schema';
import { VidhanSabhasController } from './vidhan-sabhas.controller';
import { VidhanSabhasService } from './vidhan-sabhas.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VidhanSabha.name, schema: VidhanSabhaSchema },
    ]),
  ],
  controllers: [VidhanSabhasController],
  providers: [VidhanSabhasService, VidhanSabhaRepository],
  exports: [VidhanSabhasService],
})
export class VidhanSabhasModule {}
