import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import { PersonRepository } from './repositories/person.repository';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { Person, PersonSchema } from './schemas/person.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PersonsController],
  providers: [PersonsService, PersonRepository],
  exports: [PersonsService],
})
export class PersonsModule {}
