import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Mitra, MitraSchema } from '../mitras/schemas/mitra.schema';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import { Partner, PartnerSchema } from '../partners/schemas/partner.schema';
import { Person, PersonSchema } from '../persons/schemas/person.schema';
import { GlobalIdentityService } from './services/global-identity.service';
import { S3UploadService } from './services/s3-upload.service';
import { WhatsappService } from './services/whatsapp.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Mitra.name, schema: MitraSchema },
      { name: Partner.name, schema: PartnerSchema },
    ]),
  ],
  providers: [WhatsappService, S3UploadService, GlobalIdentityService],
  exports: [WhatsappService, S3UploadService, GlobalIdentityService],
})
export class CommonModule {}
