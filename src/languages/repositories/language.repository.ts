import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Language, LanguageDocument } from '../schemas/language.schema';

@Injectable()
export class LanguageRepository extends BaseRepository<LanguageDocument> {
  constructor(
    @InjectModel(Language.name)
    private readonly languageModel: Model<LanguageDocument>,
  ) {
    super(languageModel);
  }

  async existsByCode(
    languageCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      languageCode: { $regex: `^${languageCode}$`, $options: 'i' },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.languageModel.findOne(filter).exec();
    return !!existing;
  }
}
