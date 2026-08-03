import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateTreeMasterDto } from './dto/create-tree-master.dto';
import { TreeMasterQueryDto } from './dto/tree-master-query.dto';
import { UpdateTreeMasterDto } from './dto/update-tree-master.dto';
import {
  TreeAvailability,
  TreeMaster,
  TreeMasterDocument,
} from './schemas/tree-master.schema';

@Injectable()
export class TreeMastersService {
  constructor(
    @InjectModel(TreeMaster.name)
    private readonly treeMasterModel: Model<TreeMasterDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateId(): Promise<string> {
    const result = await this.connection.collection('counters').findOneAndUpdate(
      { _id: 'treeMasterId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `TM-${seq.toString().padStart(4, '0')}`;
  }

  async create(dto: CreateTreeMasterDto): Promise<TreeMaster> {
    const name = dto.name.trim();
    const exists = await this.treeMasterModel
      .findOne({ name: new RegExp(`^${name}$`, 'i'), isDeleted: false })
      .exec();
    if (exists) {
      throw new ConflictException(`Tree Master "${name}" already exists`);
    }

    const treeMasterId = await this.generateId();
    const created = new this.treeMasterModel({
      ...dto,
      name,
      species: dto.species?.trim() || name,
      treeMasterId,
      oxygenRateKgPerYear: dto.oxygenRateKgPerYear ?? 0,
      co2RateKgPerYear: dto.co2RateKgPerYear ?? 0,
      availability: dto.availability ?? TreeAvailability.AVAILABLE,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      benefits: dto.benefits || [],
    });
    return created.save();
  }

  async findAll(query: TreeMasterQueryDto = {}): Promise<TreeMaster[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.catalogOnly) {
      filter.isActive = true;
      filter.availability = {
        $in: [
          TreeAvailability.AVAILABLE,
          TreeAvailability.AVAILABLE_ON_REQUEST,
        ],
      };
    } else {
      if (query.isActive !== undefined) filter.isActive = query.isActive;
      if (query.availability) filter.availability = query.availability;
    }

    if (query.category) filter.category = query.category;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { scientificName: { $regex: query.search, $options: 'i' } },
        { species: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.treeMasterModel
      .find(filter as any)
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<TreeMaster> {
    const entry = await this.treeMasterModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!entry) throw new NotFoundException(`Tree Master "${id}" not found`);
    return entry;
  }

  async update(id: string, dto: UpdateTreeMasterDto): Promise<TreeMaster> {
    if (dto.name) {
      const exists = await this.treeMasterModel
        .findOne({
          _id: { $ne: id },
          name: new RegExp(`^${dto.name.trim()}$`, 'i'),
          isDeleted: false,
        })
        .exec();
      if (exists) {
        throw new ConflictException(
          `Another Tree Master already uses the name "${dto.name}"`,
        );
      }
    }

    const updated = await this.treeMasterModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          ...dto,
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.species !== undefined
            ? { species: dto.species?.trim() || undefined }
            : {}),
        },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(`Tree Master "${id}" not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.treeMasterModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date(), isActive: false },
        { new: true },
      )
      .exec();
    if (!removed) throw new NotFoundException(`Tree Master "${id}" not found`);
  }
}
