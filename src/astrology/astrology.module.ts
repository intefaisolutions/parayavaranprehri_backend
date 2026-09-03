import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AstrologyController } from './astrology.controller';
import { AstrologyService } from './astrology.service';
import { ProkeralaModule } from '../prokerala/prokerala.module';
import { GeoModule } from '../geo/geo.module';
import { Person, PersonSchema } from '../persons/schemas/person.schema';

@Module({
  imports: [
    ProkeralaModule,
    GeoModule,
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
  ],
  controllers: [AstrologyController],
  providers: [AstrologyService],
})
export class AstrologyModule {}
