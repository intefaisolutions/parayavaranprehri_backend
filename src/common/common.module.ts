import { Global, Module } from '@nestjs/common';
import { WhatsappService } from './services/whatsapp.service';

@Global()
@Module({
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class CommonModule {}
