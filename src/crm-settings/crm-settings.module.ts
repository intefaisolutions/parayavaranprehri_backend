import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { CrmSettingsController } from './crm-settings.controller';
import { CrmSettingsService } from './crm-settings.service';
import { CrmSettings, CrmSettingsSchema } from './schemas/crm-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CrmSettings.name, schema: CrmSettingsSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [CrmSettingsController],
  providers: [CrmSettingsService],
  exports: [CrmSettingsService],
})
export class CrmSettingsModule {}
