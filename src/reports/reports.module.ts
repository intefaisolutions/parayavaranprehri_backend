import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MaintenanceLog,
  MaintenanceLogSchema,
} from '../maintenance-logs/schemas/maintenance-log.schema';
import { Mitra, MitraSchema } from '../mitras/schemas/mitra.schema';
import {
  Vehicle,
  VehicleSchema,
} from '../modules/vehicles/schemas/vehicle.schema';
import { Person, PersonSchema } from '../persons/schemas/person.schema';
import { Tree, TreeSchema } from '../trees/schemas/tree.schema';
import { ReportRepository } from './repositories/report.repository';
import { Report, ReportSchema } from './schemas/report.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Tree.name, schema: TreeSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Mitra.name, schema: MitraSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: MaintenanceLog.name, schema: MaintenanceLogSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
