import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MitrasModule } from '../mitras/mitras.module';
import { UsersModule } from '../modules/users/users.module';
import { MitraEventsController } from './mitra-events.controller';
import { MitraEventsService } from './mitra-events.service';
import {
  MitraEventAttendance,
  MitraEventAttendanceSchema,
} from './schemas/mitra-event-attendance.schema';
import { MitraEvent, MitraEventSchema } from './schemas/mitra-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MitraEvent.name, schema: MitraEventSchema },
      { name: MitraEventAttendance.name, schema: MitraEventAttendanceSchema },
    ]),
    MitrasModule,
    UsersModule,
  ],
  controllers: [MitraEventsController],
  providers: [MitraEventsService],
  exports: [MitraEventsService],
})
export class MitraEventsModule {}
