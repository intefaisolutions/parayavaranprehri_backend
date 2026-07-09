import { Module } from '@nestjs/common';
import { StaticDataController } from './static-data.controller';
import { StaticDataService } from './static-data.service';

@Module({
  controllers: [StaticDataController],
  providers: [StaticDataService],
})
export class StaticDataModule {}
