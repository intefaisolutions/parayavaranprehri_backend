import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import { UsersModule } from '../modules/users/users.module';
import { Vehicle, VehicleSchema } from '../modules/vehicles/schemas/vehicle.schema';
import { VehiclesModule } from '../modules/vehicles/vehicles.module';
import { TreeMaster, TreeMasterSchema } from '../tree-masters/schemas/tree-master.schema';
import { TreeMastersModule } from '../tree-masters/tree-masters.module';
import { TreesModule } from '../trees/trees.module';
import { VehicleTreeRulesModule } from '../vehicle-tree-rules/vehicle-tree-rules.module';
import { PlantationAssignmentsController } from './plantation-assignments.controller';
import { PlantationAssignmentsService } from './plantation-assignments.service';
import {
  PlantationAssignment,
  PlantationAssignmentSchema,
} from './schemas/plantation-assignment.schema';
import {
  PlantationRequest,
  PlantationRequestSchema,
} from './schemas/plantation-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlantationRequest.name, schema: PlantationRequestSchema },
      { name: PlantationAssignment.name, schema: PlantationAssignmentSchema },
      { name: TreeMaster.name, schema: TreeMasterSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    VehicleTreeRulesModule,
    TreesModule,
    TreeMastersModule,
    VehiclesModule,
    UsersModule,
  ],
  controllers: [PlantationAssignmentsController],
  providers: [PlantationAssignmentsService],
  exports: [PlantationAssignmentsService],
})
export class PlantationAssignmentsModule {}
