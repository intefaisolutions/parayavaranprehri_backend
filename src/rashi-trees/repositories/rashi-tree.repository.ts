import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { RashiTree, RashiTreeDocument } from '../schemas/rashi-tree.schema';

@Injectable()
export class RashiTreeRepository
  extends BaseRepository<RashiTreeDocument>
  implements OnModuleInit
{
  constructor(
    @InjectModel(RashiTree.name)
    private readonly rashiTreeModel: Model<RashiTreeDocument>,
  ) {
    super(rashiTreeModel);
  }

  /**
   * Older schema had unique indexes on rashiName / zodiacNumber (one tree per
   * Rashi). Drop those so multiple trees can be assigned to one Rashi.
   */
  async onModuleInit() {
    try {
      const indexes = await this.rashiTreeModel.collection.indexes();
      for (const idx of indexes) {
        const key = idx.key || {};
        const name = idx.name;
        if (!name || name === '_id_') continue;
        const onlyRashi =
          Object.keys(key).length === 1 && key.rashiName === 1 && idx.unique;
        const onlyZodiac =
          Object.keys(key).length === 1 && key.zodiacNumber === 1 && idx.unique;
        if (onlyRashi || onlyZodiac) {
          await this.rashiTreeModel.collection.dropIndex(name);
        }
      }
    } catch {
      // Index may already be gone — ignore.
    }
  }

  async findAllByRashiName(rashiName: string): Promise<RashiTreeDocument[]> {
    return this.rashiTreeModel
      .find({
        rashiName: { $regex: `^${rashiName}$`, $options: 'i' },
        isDeleted: false,
        isActive: true,
      })
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findAllByZodiacNumber(
    zodiacNumber: number,
  ): Promise<RashiTreeDocument[]> {
    return this.rashiTreeModel
      .find({ zodiacNumber, isDeleted: false, isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  /** Prevent the same tree being added twice for the same Rashi. */
  async existsByRashiAndTree(
    rashiName: string,
    zodiacNumber: number,
    recommendedTree: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      zodiacNumber,
      recommendedTree: {
        $regex: `^${recommendedTree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
      rashiName: { $regex: `^${rashiName}$`, $options: 'i' },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.rashiTreeModel.findOne(filter).exec();
    return !!existing;
  }
}
