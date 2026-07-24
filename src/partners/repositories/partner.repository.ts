import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Partner, PartnerDocument } from '../schemas/partner.schema';

@Injectable()
export class PartnerRepository extends BaseRepository<PartnerDocument> {
  constructor(
    @InjectModel(Partner.name)
    private readonly partnerModel: Model<PartnerDocument>,
  ) {
    super(partnerModel);
  }

  async existsByPhone(phone: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = { phone, isDeleted: false };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.partnerModel.findOne(filter).exec();
    return !!existing;
  }
}
