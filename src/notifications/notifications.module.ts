import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../modules/auth/auth.module';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import { Mitra, MitraSchema } from '../mitras/schemas/mitra.schema';
import { Partner, PartnerSchema } from '../partners/schemas/partner.schema';
import { Person, PersonSchema } from '../persons/schemas/person.schema';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Partner.name, schema: PartnerSchema },
      { name: Mitra.name, schema: MitraSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationRepository,
    NotificationDispatchService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
