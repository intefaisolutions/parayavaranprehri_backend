import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../modules/users/users.module';
import { RashiPlantRequestsController } from './rashi-plant-requests.controller';
import { RashiPlantRequestsService } from './rashi-plant-requests.service';
import {
  RashiPlantRequest,
  RashiPlantRequestSchema,
} from './schemas/rashi-plant-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RashiPlantRequest.name, schema: RashiPlantRequestSchema },
    ]),
    UsersModule,
  ],
  controllers: [RashiPlantRequestsController],
  providers: [RashiPlantRequestsService],
  exports: [RashiPlantRequestsService],
})
export class RashiPlantRequestsModule {}
