import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { QueryKnowledgeBaseDto } from './dto/query-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import {
  KnowledgeBase,
  KnowledgeBaseDocument,
} from './schemas/knowledge-base.schema';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectModel(KnowledgeBase.name)
    private kbModel: Model<KnowledgeBaseDocument>,
  ) {}

  async create(
    dto: CreateKnowledgeBaseDto,
    actorId?: string,
  ): Promise<KnowledgeBase> {
    const data: any = { ...dto };
    if (actorId && Types.ObjectId.isValid(actorId)) {
      data.createdBy = new Types.ObjectId(actorId);
      data.updatedBy = new Types.ObjectId(actorId);
    }
    const created = new this.kbModel(data);
    return created.save();
  }

  async findAll(queryDto: QueryKnowledgeBaseDto) {
    const {
      search,
      category,
      language,
      status,
      sortBy,
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isDeleted: false };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }
    if (language) {
      filter.language = language;
    }
    if (status) {
      filter.status = status;
    }

    const sortConfig: Record<string, 1 | -1> = {};
    if (search) {
      sortConfig.score = { $meta: 'textScore' } as any;
    } else if (sortBy) {
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortConfig.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.kbModel
        .find(filter, search ? { score: { $meta: 'textScore' } } : undefined)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.kbModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<KnowledgeBase> {
    const item = await this.kbModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!item) {
      throw new NotFoundException(`KnowledgeBase entry #${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    dto: UpdateKnowledgeBaseDto,
    actorId?: string,
  ): Promise<KnowledgeBase> {
    const data: any = { ...dto };
    if (actorId && Types.ObjectId.isValid(actorId)) {
      data.updatedBy = new Types.ObjectId(actorId);
    }

    const updated = await this.kbModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`KnowledgeBase entry #${id} not found`);
    }
    return updated;
  }

  async remove(id: string, actorId?: string): Promise<void> {
    const data: any = { isDeleted: true, deletedAt: new Date() };
    if (actorId && Types.ObjectId.isValid(actorId)) {
      data.updatedBy = new Types.ObjectId(actorId);
    }

    const deleted = await this.kbModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data)
      .exec();

    if (!deleted) {
      throw new NotFoundException(`KnowledgeBase entry #${id} not found`);
    }
  }
}
