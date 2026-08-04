import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MasterGeographySeedService } from './master-geography.seed';
import { MasterGeographyService } from './master-geography.service';
import {
  MasterConstituency,
  MasterConstituencySchema,
} from './schemas/master-constituency.schema';
import {
  MasterCountry,
  MasterCountrySchema,
} from './schemas/master-country.schema';
import {
  MasterDistrict,
  MasterDistrictSchema,
} from './schemas/master-district.schema';
import {
  MasterState,
  MasterStateSchema,
} from './schemas/master-state.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterCountry.name, schema: MasterCountrySchema },
      { name: MasterState.name, schema: MasterStateSchema },
      { name: MasterDistrict.name, schema: MasterDistrictSchema },
      { name: MasterConstituency.name, schema: MasterConstituencySchema },
    ]),
  ],
  providers: [MasterGeographyService, MasterGeographySeedService],
  exports: [MasterGeographyService, MasterGeographySeedService, MongooseModule],
})
export class MasterGeographyModule {}
