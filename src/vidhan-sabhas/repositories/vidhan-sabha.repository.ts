import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from '../schemas/vidhan-sabha.schema';

@Injectable()
export class VidhanSabhaRepository extends BaseRepository<VidhanSabhaDocument> {
  constructor(
    @InjectModel(VidhanSabha.name)
    private readonly vidhanSabhaModel: Model<VidhanSabhaDocument>,
  ) {
    super(vidhanSabhaModel);
  }

  async existsByName(
    vidhanSabhaName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      vidhanSabhaName: { $regex: `^${vidhanSabhaName}$`, $options: 'i' },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.vidhanSabhaModel.findOne(filter).exec();
    return !!existing;
  }
}
