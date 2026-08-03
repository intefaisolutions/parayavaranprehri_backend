import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandsModule } from '../lands/lands.module';
import {
  TreeMaster,
  TreeMasterSchema,
} from '../tree-masters/schemas/tree-master.schema';
import { PlantationsController } from './plantations.controller';
import { PlantationsService } from './plantations.service';
import { Plantation, PlantationSchema } from './schemas/plantation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plantation.name, schema: PlantationSchema },
      { name: TreeMaster.name, schema: TreeMasterSchema },
    ]),
    LandsModule,
  ],
  controllers: [PlantationsController],
  providers: [PlantationsService],
  exports: [PlantationsService],
})
export class PlantationsModule {}
