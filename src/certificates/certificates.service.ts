import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Connection, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MitrasService } from '../mitras/mitras.service';
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

  async verify(verificationCode: string): Promise<Certificate> {
    const certificate = await this.certificateModel
      .findOne({ verificationCode, isDeleted: false })
      .populate('templateId')
      .exec();
    if (!certificate) {
      throw new NotFoundException('Invalid or unknown verification code');
    }
    return certificate;
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

  async shareViaWhatsapp(id: string): Promise<WhatsappSendResult> {
    const certificate = await this.findOne(id);

    if (!certificate.recipientMobile) {
      return {
        success: false,
        error: 'This certificate has no recipient mobile number on file',
      };
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ??
      '';
    const verifyLink = frontendUrl
      ? `${frontendUrl}/verify-certificate/${certificate.verificationCode}`
      : certificate.verificationCode;

    const message =
      `Congratulations ${certificate.recipientName}! 🎉\n\n` +
      `Your certificate "${certificate.title}" (${certificate.certificateNumber}) ` +
      `from Paryavaran Prahri has been issued.\n\n` +
      `Verify it here: ${verifyLink}`;

    return this.whatsappService.sendMessage(certificate.recipientMobile, message, {
      pdfUrl: certificate.pdfUrl,
    });
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
