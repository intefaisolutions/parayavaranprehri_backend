import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrmSettingsModule } from '../crm-settings/crm-settings.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadRepository } from './repositories/lead.repository';
import { Lead, LeadSchema } from './schemas/lead.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    CrmSettingsModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadRepository],
  exports: [LeadsService, LeadRepository],
})
export class LeadsModule {}
