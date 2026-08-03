import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VidhanSabha,
  VidhanSabhaSchema,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VidhanSabha.name, schema: VidhanSabhaSchema },
    ]),
  ],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
