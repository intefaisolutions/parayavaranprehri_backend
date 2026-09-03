import { Module } from '@nestjs/common';
import { ProkeralaService } from './prokerala.service';

@Module({
  providers: [ProkeralaService],
  exports: [ProkeralaService],
})
export class ProkeralaModule {}
