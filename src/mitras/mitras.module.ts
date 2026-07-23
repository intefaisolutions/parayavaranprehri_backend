import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MitrasController } from './mitras.controller';
import { MitrasService } from './mitras.service';
import { Mitra, MitraSchema } from './schemas/mitra.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mitra.name, schema: MitraSchema }]),
  ],
  controllers: [MitrasController],
  providers: [MitrasService],
  exports: [MitrasService],
})
export class MitrasModule {}
