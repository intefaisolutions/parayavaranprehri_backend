import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonIdentityRepository } from './repositories/person-identity.repository';
import { PersonIdentityController } from './person-identity.controller';
import { PersonIdentityService } from './person-identity.service';
import {
  PersonIdentity,
  PersonIdentitySchema,
} from './schemas/person-identity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PersonIdentity.name, schema: PersonIdentitySchema },
    ]),
  ],
  controllers: [PersonIdentityController],
  providers: [PersonIdentityService, PersonIdentityRepository],
  exports: [PersonIdentityService],
})
export class PersonIdentityModule {}
