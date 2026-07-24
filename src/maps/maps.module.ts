import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MapRepository } from './repositories/map.repository';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapRecord, MapRecordSchema } from './schemas/map.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MapRecord.name, schema: MapRecordSchema },
    ]),
  ],
  controllers: [MapsController],
  providers: [MapsService, MapRepository],
  exports: [MapsService],
})
export class MapsModule {}
