import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Connection, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { MitrasService } from '../mitras/mitras.service';
import { UsersService } from '../modules/users/users.service';
import {
  WhatsappSendResult,
  WhatsappService,
} from '../common/services/whatsapp.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import {
  CertificateTemplate,
  CertificateTemplateDocument,
} from './schemas/certificate-template.schema';
import {
  Certificate,
  CertificateDocument,
  CertificateRecipientType,
  CertificateStatus,
} from './schemas/certificate.schema';

export interface CertificateQuery {
  status?: string;
  recipientType?: string;
  search?: string;
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(CertificateTemplate.name)
    private readonly templateModel: Model<CertificateTemplateDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly mitrasService: MitrasService,
    private readonly usersService: UsersService,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  private async generateCertificateNumber(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'certificateNumber' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `CERT-${seq.toString().padStart(6, '0')}`;
  }

  private generateVerificationCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  async issue(dto: CreateCertificateDto): Promise<Certificate> {
    const template = await this.templateModel
      .findOne({ _id: dto.templateId, isDeleted: false })
      .exec();
    if (!template) {
      throw new NotFoundException(
        `Certificate template "${dto.templateId}" not found`,
      );
    }

    const recipientType = dto.recipientType ?? CertificateRecipientType.MITRA;
    let recipientName = dto.recipientName;
    let recipientMobile = dto.recipientMobile;
    let treesPlanted = dto.treesPlanted;

    if (recipientType === CertificateRecipientType.MITRA) {
      const mitra = await this.mitrasService.findByMitraId(dto.recipientId);
      recipientName = mitra.name;
      recipientMobile = mitra.mobile;
      treesPlanted = treesPlanted ?? mitra.treesPlanted;
    } else if (!recipientName) {
      throw new NotFoundException(
        'recipientName is required when recipientType is USER',
      );
    }

    const certificateNumber = await this.generateCertificateNumber();
    const verificationCode = this.generateVerificationCode();

    const certificate = new this.certificateModel({
      ...dto,
      recipientType,
      recipientName,
      recipientMobile,
      treesPlanted,
      certificateNumber,
      verificationCode,
      issueDate: dto.issueDate ?? new Date(),
    });

    return certificate.save();
  }

  async findAll(query: CertificateQuery = {}): Promise<Certificate[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.status) filter.status = query.status;
    if (query.recipientType) filter.recipientType = query.recipientType;

    if (query.search) {
      filter.$or = [
        { recipientName: { $regex: query.search, $options: 'i' } },
        { certificateNumber: { $regex: query.search, $options: 'i' } },
        { recipientId: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.certificateModel
      .find(filter)
      .populate('templateId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByRecipient(recipientId: string): Promise<Certificate[]> {
    return this.certificateModel
      .find({ recipientId, isDeleted: false })
      .populate('templateId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findMine(user: JwtPayload): Promise<Certificate[]> {
    const me = (await this.usersService.findOne(user.sub)) as {
      phone?: string;
    };
    const or: Record<string, unknown>[] = [{ recipientId: user.sub }];

    if (me.phone) {
      or.push({ recipientMobile: me.phone });
      const mitra = await this.mitrasService.findByMobile(me.phone);
      if (mitra?.mitraId) {
        or.push({ recipientId: mitra.mitraId });
      }
    }

    return this.certificateModel
      .find({ isDeleted: false, $or: or })
      .populate('templateId')
      .sort({ createdAt: -1 })
      .exec();
  }

  private async assertCanShare(
    certificate: Certificate,
    user: JwtPayload,
  ): Promise<void> {
    if (
      user.role === SystemRole.SUPER_ADMIN ||
      user.role === SystemRole.ADMIN
    ) {
      return;
    }

    const mine = await this.findMine(user);
    const owned = mine.some(
      (c) => String((c as CertificateDocument)._id) === String((certificate as CertificateDocument)._id),
    );
    if (!owned) {
      throw new ForbiddenException(
        'You can only share certificates issued to you',
      );
    }
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.certificateModel
      .findOne({ _id: id, isDeleted: false })
      .populate('templateId')
      .exec();
    if (!certificate) {
      throw new NotFoundException(`Certificate "${id}" not found`);
    }
    return certificate;
  }

  /**
   * Public verify payload for share links:
   * https://…/certificate/{verificationCode}
   */
  async verify(verificationCode: string) {
    const code = String(verificationCode || '').trim();
    if (!code) {
      throw new NotFoundException('Invalid or unknown verification code');
    }

    const certificate = await this.certificateModel
      .findOne({
        verificationCode: new RegExp(
          `^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i',
        ),
        isDeleted: false,
      })
      .populate('templateId')
      .exec();

    if (!certificate) {
      throw new NotFoundException('Invalid or unknown verification code');
    }

    const template = certificate.templateId as unknown as CertificateTemplate & {
      _id?: unknown;
    };

    return {
      valid: certificate.status === CertificateStatus.ISSUED,
      status: certificate.status,
      recipientName: certificate.recipientName,
      title: certificate.title,
      description: certificate.description || template?.description || '',
      eventName: certificate.eventName || '',
      issueDate: certificate.issueDate,
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      pdfUrl: certificate.pdfUrl || null,
      treesPlanted: certificate.treesPlanted ?? null,
      template: template
        ? {
            templateName: template.templateName,
            certificateType: template.certificateType,
            logoUrl: template.logoUrl || '',
            signatureUrl: template.signatureUrl || '',
            backgroundUrl: template.backgroundUrl || '',
          }
        : null,
      publicUrlPath: `/certificate/${certificate.verificationCode}`,
    };
  }

  buildPublicCertificateUrl(verificationCode: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
      this.configService.get<string>('ADMIN_URL')?.replace(/\/$/, '') ||
      '';
    if (!frontendUrl) {
      return `/certificate/${verificationCode}`;
    }
    return `${frontendUrl}/certificate/${encodeURIComponent(verificationCode)}`;
  }

  async update(id: string, dto: UpdateCertificateDto): Promise<Certificate> {
    const updated = await this.certificateModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
      .populate('templateId')
      .exec();
    if (!updated) {
      throw new NotFoundException(`Certificate "${id}" not found`);
    }
    return updated;
  }

  async revoke(id: string): Promise<Certificate> {
    return this.update(id, { status: CertificateStatus.REVOKED });
  }

  async shareViaWhatsapp(
    id: string,
    user?: JwtPayload,
  ): Promise<WhatsappSendResult> {
    const certificate = await this.findOne(id);
    if (user) {
      await this.assertCanShare(certificate, user);
    }

    if (!certificate.recipientMobile) {
      return {
        success: false,
        error: 'This certificate has no recipient mobile number on file',
      };
    }

    const verifyLink = this.buildPublicCertificateUrl(
      certificate.verificationCode,
    );

    const message =
      `🌱 Paryavaran Prahri Certificate\n\n` +
      `Congratulations ${certificate.recipientName}!\n\n` +
      `Your ${certificate.title} is ready.\n` +
      (certificate.certificateNumber
        ? `Certificate No: ${certificate.certificateNumber}\n`
        : '') +
      `\nView Certificate:\n${verifyLink}`;

    // URL share only — do not attach raw S3 PDF to WhatsApp payload
    return this.whatsappService.sendMessage(
      certificate.recipientMobile,
      message,
    );
  }

  async remove(id: string): Promise<void> {
    const removed = await this.certificateModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) {
      throw new NotFoundException(`Certificate "${id}" not found`);
    }
  }
}
