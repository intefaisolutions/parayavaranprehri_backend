import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { Tree, TreeSchema } from '../../trees/schemas/tree.schema';
import { AuthModule } from '../auth/auth.module';
import { Otp, OtpSchema } from '../auth/schemas/otp.schema';
import { UsersModule } from '../users/users.module';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Tree.name, schema: TreeSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
    AuthModule,
    UsersModule,
    CommonModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
