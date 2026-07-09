import { Module } from '@nestjs/common';
import { MitrasController } from './mitras.controller';
import { MitrasService } from './mitras.service';

@Module({
  controllers: [MitrasController],
  providers: [MitrasService]
})
export class MitrasModule {}
