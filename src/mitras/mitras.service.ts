import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateMitraDto } from './dto/create-mitra.dto';
import { UpdateMitraDto } from './dto/update-mitra.dto';
import { Mitra, MitraDocument } from './schemas/mitra.schema';

export interface MitraQuery {
  status?: string;
  search?: string;
}

@Injectable()
export class MitrasService {
  constructor(
    @InjectModel(Mitra.name) private readonly mitraModel: Model<MitraDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateMitraId(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'mitraId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `PM-${seq.toString().padStart(6, '0')}`;
  }

  async create(dto: CreateMitraDto): Promise<Mitra> {
    const existing = await this.mitraModel
      .findOne({ mobile: dto.mobile, isDeleted: false })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Mitra with mobile "${dto.mobile}" already exists`,
      );
    }

    const mitraId = await this.generateMitraId();
    const mitra = new this.mitraModel({ ...dto, mitraId });
    return mitra.save();
  }

  async findAll(query: MitraQuery = {}): Promise<Mitra[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
        { mitraId: { $regex: query.search, $options: 'i' } },
        { assignedZone: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.mitraModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Mitra> {
    const mitra = await this.mitraModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!mitra) {
      throw new NotFoundException(`Mitra with ID "${id}" not found`);
    }
    return mitra;
  }

  async findByMitraId(mitraId: string): Promise<Mitra> {
    const mitra = await this.mitraModel
      .findOne({ mitraId, isDeleted: false })
      .exec();
    if (!mitra) {
      throw new NotFoundException(`Mitra with ID "${mitraId}" not found`);
    }
    return mitra;
  }

  async findByMobile(mobile: string): Promise<Mitra | null> {
    return this.mitraModel.findOne({ mobile, isDeleted: false }).exec();
  }

  async update(id: string, dto: UpdateMitraDto): Promise<Mitra> {
    const updated = await this.mitraModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Mitra with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.mitraModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) {
      throw new NotFoundException(`Mitra with ID "${id}" not found`);
    }
  }

  async incrementTreesPlanted(mitraId: string, count = 1): Promise<void> {
    await this.mitraModel
      .updateOne({ mitraId, isDeleted: false }, { $inc: { treesPlanted: count } })
      .exec();
  }
}
