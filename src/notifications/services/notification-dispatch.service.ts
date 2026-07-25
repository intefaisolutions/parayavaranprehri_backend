import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService } from '../../modules/auth/services/email.service';
import { SmsService } from '../../modules/auth/services/sms.service';
import { WhatsappService } from '../../common/services/whatsapp.service';
import { Mitra, MitraDocument, MitraStatus } from '../../mitras/schemas/mitra.schema';
import { Partner, PartnerDocument, PartnerStatus } from '../../partners/schemas/partner.schema';
import { Person, PersonDocument, PersonStatus } from '../../persons/schemas/person.schema';
import { User, UserDocument } from '../../modules/users/schemas/user.schema';
import {
  Notification,
  NotificationAudience,
  NotificationType,
} from '../schemas/notification.schema';

interface Recipient {
  name: string;
  phone?: string;
  email?: string;
}

export interface DispatchResult {
  attempted: number;
  delivered: number;
  failureReason: string | null;
}

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsappService,
    @InjectModel(Person.name) private readonly personModel: Model<PersonDocument>,
    @InjectModel(Partner.name) private readonly partnerModel: Model<PartnerDocument>,
    @InjectModel(Mitra.name) private readonly mitraModel: Model<MitraDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private async resolveRecipients(
    targetAudience: NotificationAudience,
  ): Promise<Recipient[]> {
    const [customers, employees, partners, mitras] = await Promise.all([
      this.personModel
        .find({ isDeleted: false, status: PersonStatus.ACTIVE })
        .select('name mobile email')
        .lean(),
      this.userModel
        .find({ isDeleted: false, isActive: true })
        .select('firstName lastName phone email')
        .lean(),
      this.partnerModel
        .find({ isDeleted: false, status: PartnerStatus.ACTIVE })
        .select('partnerName phone email')
        .lean(),
      this.mitraModel
        .find({ isDeleted: false, status: MitraStatus.APPROVED })
        .select('name mobile email')
        .lean(),
    ]);

    const customerRecipients: Recipient[] = customers.map((p: any) => ({
      name: p.name,
      phone: p.mobile,
      email: p.email,
    }));
    const employeeRecipients: Recipient[] = employees.map((u: any) => ({
      name: `${u.firstName} ${u.lastName}`.trim(),
      phone: u.phone,
      email: u.email,
    }));
    const partnerRecipients: Recipient[] = [
      ...partners.map((p: any) => ({
        name: p.partnerName,
        phone: p.phone,
        email: p.email,
      })),
      ...mitras.map((m: any) => ({
        name: m.name,
        phone: m.mobile,
        email: m.email,
      })),
    ];

    switch (targetAudience) {
      case NotificationAudience.CUSTOMERS:
        return customerRecipients;
      case NotificationAudience.EMPLOYEES:
        return employeeRecipients;
      case NotificationAudience.PARTNERS:
        return partnerRecipients;
      case NotificationAudience.SPECIFIC_GROUP:
        // No group/segment data model exists yet, so a specific group of
        // recipients cannot be resolved. Surface this clearly instead of
        // silently sending to nobody or to everyone.
        return [];
      case NotificationAudience.ALL_USERS:
      default:
        return [...customerRecipients, ...employeeRecipients, ...partnerRecipients];
    }
  }

  async dispatch(notification: Notification): Promise<DispatchResult> {
    const { notificationType, targetAudience, message, notificationTitle } =
      notification;

    if (notificationType === NotificationType.PUSH) {
      // No push provider (FCM/APNs) is wired up yet.
      return {
        attempted: 0,
        delivered: 0,
        failureReason: 'Push delivery is not configured yet.',
      };
    }

    const recipients = await this.resolveRecipients(targetAudience);

    if (targetAudience === NotificationAudience.SPECIFIC_GROUP) {
      return {
        attempted: 0,
        delivered: 0,
        failureReason:
          '"Specific Group" targeting is not supported yet — no group/segment is defined.',
      };
    }

    if (recipients.length === 0) {
      return {
        attempted: 0,
        delivered: 0,
        failureReason: `No active recipients found for audience "${targetAudience}".`,
      };
    }

    let attempted = 0;
    let delivered = 0;

    for (const recipient of recipients) {
      if (notificationType === NotificationType.SMS) {
        if (!recipient.phone) continue;
        attempted++;
        const ok = await this.smsService.sendMessage(recipient.phone, message);
        if (ok) delivered++;
        continue;
      }

      if (notificationType === NotificationType.WHATSAPP) {
        if (!recipient.phone) continue;
        attempted++;
        const result = await this.whatsappService.sendMessage(
          recipient.phone,
          message,
        );
        if (result.success) delivered++;
        continue;
      }

      if (notificationType === NotificationType.EMAIL) {
        if (!recipient.email) continue;
        attempted++;
        const ok = await this.emailService.sendMail(
          recipient.email,
          notificationTitle,
          `<p>${message}</p>`,
        );
        if (ok) delivered++;
        continue;
      }
    }

    this.logger.log(
      `Notification "${notificationTitle}" (${notificationType}) dispatched to ${delivered}/${attempted} recipients.`,
    );

    if (attempted === 0) {
      return {
        attempted: 0,
        delivered: 0,
        failureReason: `No recipients in audience "${targetAudience}" have a ${
          notificationType === NotificationType.EMAIL ? 'email address' : 'phone number'
        } on file.`,
      };
    }

    return {
      attempted,
      delivered,
      failureReason: delivered === 0 ? 'Delivery failed for all recipients.' : null,
    };
  }
}
