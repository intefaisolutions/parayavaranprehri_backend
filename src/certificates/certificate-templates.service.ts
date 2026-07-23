import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';
import {
  CertificateTemplate,
  CertificateTemplateDocument,
} from './schemas/certificate-template.schema';

@Injectable()
export class CertificateTemplatesService {
  constructor(
    @InjectModel(CertificateTemplate.name)
    private readonly templateModel: Model<CertificateTemplateDocument>,
  ) {}

  async create(
    dto: CreateCertificateTemplateDto,
  ): Promise<CertificateTemplate> {
    const template = new this.templateModel(dto);
    return template.save();
  }

  async findAll(search?: string): Promise<CertificateTemplate[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { certificateType: { $regex: search, $options: 'i' } },
      ];
    }

    return this.templateModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<CertificateTemplate> {
    const template = await this.templateModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!template) {
      throw new NotFoundException(`Certificate template "${id}" not found`);
    }
    return template;
  }

  async update(
    id: string,
    dto: UpdateCertificateTemplateDto,
  ): Promise<CertificateTemplate> {
    const updated = await this.templateModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Certificate template "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.templateModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) {
      throw new NotFoundException(`Certificate template "${id}" not found`);
    }
  }
}
