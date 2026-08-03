import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { GlobalIdentityService } from '../common/services/global-identity.service';
import {
  normalizeEmail,
  normalizeMobile,
} from '../common/utils/identity.util';
import { CreateMitraDto } from './dto/create-mitra.dto';
import { UpdateMitraDto } from './dto/update-mitra.dto';
import { Mitra, MitraDocument, MitraSource, MitraStatus } from './schemas/mitra.schema';

export interface MitraQuery {
  status?: string;
  search?: string;
}

@Injectable()
export class MitrasService {
  constructor(
    @InjectModel(Mitra.name) private readonly mitraModel: Model<MitraDocument>,
    private readonly globalIdentity: GlobalIdentityService,
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

  /**
   * Admin-created Mitra: defaults to Approved (admin is vouching for them
   * directly) but the admin can still override `status` explicitly, e.g.
   * to create one as Pending or Cancelled.
   */
  async create(dto: CreateMitraDto): Promise<Mitra> {
    return this.createInternal(dto, MitraSource.ADMIN, MitraStatus.APPROVED);
  }

  /**
   * App self-registration: always starts Pending and is always tagged as
   * `source: app`, regardless of what the client sends, so it goes through
   * admin review before becoming Approved.
   */
  async selfRegister(dto: CreateMitraDto): Promise<Mitra> {
    return this.createInternal(dto, MitraSource.APP, MitraStatus.PENDING, true);
  }

  private async createInternal(
    dto: CreateMitraDto,
    source: MitraSource,
    defaultStatus: MitraStatus,
    forceStatus = false,
  ): Promise<Mitra> {
    const mobile = normalizeMobile(dto.mobile) ?? dto.mobile.trim();
    const email = normalizeEmail(dto.email);

    await this.globalIdentity.assertAvailable({
      as: 'mitra',
      mobile,
      email,
    });

    const mitraId = await this.generateMitraId();
    const status = forceStatus ? defaultStatus : dto.status ?? defaultStatus;
    const mitra = new this.mitraModel({
      ...dto,
      mobile,
      email,
      mitraId,
      source,
      status,
    });
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
    const normalized = normalizeMobile(mobile) ?? mobile;
    return this.mitraModel
      .findOne({ mobile: normalized, isDeleted: false })
      .exec();
  }

  async update(id: string, dto: UpdateMitraDto): Promise<Mitra> {
    const existing = await this.findOne(id);
    const patch: Record<string, unknown> = { ...dto };

    const nextMobile =
      dto.mobile !== undefined
        ? normalizeMobile(dto.mobile) ?? dto.mobile.trim()
        : normalizeMobile(existing.mobile) ?? existing.mobile;
    const nextEmail =
      dto.email !== undefined
        ? normalizeEmail(dto.email)
        : normalizeEmail(existing.email);

    if (dto.mobile !== undefined) {
      patch.mobile = nextMobile;
    }
    if (dto.email !== undefined) {
      patch.email = nextEmail;
    }

    if (dto.mobile !== undefined || dto.email !== undefined) {
      await this.globalIdentity.assertAvailable({
        as: 'mitra',
        mobile: nextMobile,
        email: nextEmail,
        exclude: { mitraId: id },
      });
    }

    const updated = await this.mitraModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, patch, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Mitra with ID "${id}" not found`);
    }
    return updated;
  }

  async approve(id: string): Promise<Mitra> {
    const updated = await this.mitraModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { status: MitraStatus.APPROVED },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`Mitra with ID "${id}" not found`);
    }
    return updated;
  }

  async reject(id: string): Promise<Mitra> {
    const updated = await this.mitraModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { status: MitraStatus.CANCELLED },
        { new: true },
      )
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
