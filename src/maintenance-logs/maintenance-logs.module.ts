import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MitrasModule } from '../mitras/mitras.module';
import { UsersModule } from '../modules/users/users.module';
import { MaintenanceLogsController } from './maintenance-logs.controller';
import { MaintenanceLogsService } from './maintenance-logs.service';
import {
  MaintenanceLog,
  MaintenanceLogSchema,
} from './schemas/maintenance-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceLog.name, schema: MaintenanceLogSchema },
    ]),
    UsersModule,
    MitrasModule,
  ],
  controllers: [MaintenanceLogsController],
  providers: [MaintenanceLogsService],
  exports: [MaintenanceLogsService],
})
export class MaintenanceLogsModule {}
