import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tree, TreeSchema } from '../../trees/schemas/tree.schema';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Tree.name, schema: TreeSchema },
    ]),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
