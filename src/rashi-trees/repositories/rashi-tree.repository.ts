import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { RashiTree, RashiTreeDocument } from '../schemas/rashi-tree.schema';

@Injectable()
export class RashiTreeRepository extends BaseRepository<RashiTreeDocument> {
  constructor(
    @InjectModel(RashiTree.name)
    private readonly rashiTreeModel: Model<RashiTreeDocument>,
  ) {
    super(rashiTreeModel);
  }

  async findByRashiName(rashiName: string): Promise<RashiTreeDocument | null> {
    return this.rashiTreeModel
      .findOne({
        rashiName: { $regex: `^${rashiName}$`, $options: 'i' },
        isDeleted: false,
        isActive: true,
      })
      .exec();
  }

  async findByZodiacNumber(
    zodiacNumber: number,
  ): Promise<RashiTreeDocument | null> {
    return this.rashiTreeModel
      .findOne({ zodiacNumber, isDeleted: false, isActive: true })
      .exec();
  }

  async existsByRashiOrNumber(
    rashiName: string,
    zodiacNumber: number,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      $or: [
        { rashiName: { $regex: `^${rashiName}$`, $options: 'i' } },
        { zodiacNumber },
      ],
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.rashiTreeModel.findOne(filter).exec();
    return !!existing;
  }
}
