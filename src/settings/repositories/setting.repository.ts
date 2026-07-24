import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Setting, SettingDocument } from '../schemas/setting.schema';

@Injectable()
export class SettingRepository extends BaseRepository<SettingDocument> {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {
    super(settingModel);
  }

  async findBySettingName(settingName: string): Promise<SettingDocument | null> {
    return this.settingModel
      .findOne({
        settingName: { $regex: `^${settingName}$`, $options: 'i' },
        isDeleted: false,
      })
      .exec();
  }

  async existsBySettingName(
    settingName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      settingName: { $regex: `^${settingName}$`, $options: 'i' },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.settingModel.findOne(filter).exec();
    return !!existing;
  }
}
