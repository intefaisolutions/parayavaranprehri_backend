import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallCenterController } from './call-center.controller';
import { CallCenterService } from './call-center.service';
import { CallCenterRepository } from './repositories/call-center.repository';
import {
  CallCenterContact,
  CallCenterContactSchema,
} from './schemas/call-center.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallCenterContact.name, schema: CallCenterContactSchema },
    ]),
  ],
  controllers: [CallCenterController],
  providers: [CallCenterService, CallCenterRepository],
  exports: [CallCenterService],
})
export class CallCenterModule {}
