import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GreenSelfiesService } from './green-selfies.service';
import { GreenSelfiesController } from './green-selfies.controller';
import { GreenSelfie, GreenSelfieSchema } from './schemas/green-selfie.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GreenSelfie.name, schema: GreenSelfieSchema },
    ]),
  ],
  controllers: [GreenSelfiesController],
  providers: [GreenSelfiesService],
  exports: [GreenSelfiesService],
})
export class GreenSelfiesModule {}
