import { Module } from '@nestjs/common';
import { PersonIdentityController } from './person-identity.controller';
import { PersonIdentityService } from './person-identity.service';

@Module({
  controllers: [PersonIdentityController],
  providers: [PersonIdentityService]
})
export class PersonIdentityModule {}
