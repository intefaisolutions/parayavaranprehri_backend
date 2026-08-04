import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { GlobalIdentityService } from '../common/services/global-identity.service';
import {
  normalizeEmail,
  normalizeMobile,
} from '../common/utils/identity.util';
import { Tree, TreeDocument } from '../trees/schemas/tree.schema';
import { CreateMitraDto } from './dto/create-mitra.dto';
import { UpdateMitraDto } from './dto/update-mitra.dto';
import {
  Mitra,
  MitraDocument,
  MitraSource,
  MitraStatus,
  MitraTreeAssignment,
} from './schemas/mitra.schema';

export interface MitraQuery {
  status?: string;
  search?: string;
}

@Injectable()
export class MitrasService {
  constructor(
    @InjectModel(Mitra.name) private readonly mitraModel: Model<MitraDocument>,
    @InjectModel(Tree.name) private readonly treeModel: Model<TreeDocument>,
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
    const assignment = this.normalizeAssignment(dto);

    const mitra = new this.mitraModel({
      ...dto,
      ...assignment,
      mobile,
      email,
      mitraId,
      source,
      status,
    });
    const saved = await mitra.save();
    await this.applyTreeLinks(saved);
    return saved;
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
        { vidhanSabha: { $regex: query.search, $options: 'i' } },
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

    Object.assign(patch, this.normalizeAssignment(dto, existing));

    const updated = await this.mitraModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, patch, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Mitra with ID "${id}" not found`);
    }

    if (
      dto.landId !== undefined ||
      dto.treeAssignment !== undefined ||
      dto.assignedTreeId !== undefined
    ) {
      await this.applyTreeLinks(updated as MitraDocument);
    }

    return updated;
  }

  private normalizeAssignment(
    dto: Partial<CreateMitraDto>,
    existing?: Mitra,
  ): Record<string, unknown> {
    const mode =
      dto.treeAssignment ??
      existing?.treeAssignment ??
      MitraTreeAssignment.NONE;

    const landId =
      dto.landId !== undefined
        ? dto.landId
          ? new Types.ObjectId(dto.landId)
          : null
        : (existing?.landId ?? null);

    if (!landId && mode !== MitraTreeAssignment.NONE && dto.treeAssignment) {
      throw new BadRequestException(
        'Select a Land before assigning trees to this Mitra',
      );
    }

    if (mode === MitraTreeAssignment.SINGLE && dto.treeAssignment === mode) {
      if (!dto.assignedTreeId) {
        throw new BadRequestException(
          'Select a tree when tree assignment is SINGLE',
        );
      }
    }

    const assignedTreeId =
      mode === MitraTreeAssignment.SINGLE
        ? dto.assignedTreeId
          ? new Types.ObjectId(dto.assignedTreeId)
          : existing?.assignedTreeId ?? null
        : null;

    return {
      landId: landId ?? null,
      landName: dto.landName ?? (landId ? existing?.landName : null) ?? null,
      treeAssignment: landId ? mode : MitraTreeAssignment.NONE,
      assignedTreeId,
      assignedTreeName:
        mode === MitraTreeAssignment.SINGLE
          ? dto.assignedTreeName ?? existing?.assignedTreeName ?? null
          : null,
    };
  }

  /**
   * Link trees on the assigned land to this Mitra (ALL or SINGLE).
   * Only runs for Approved mitras.
   */
  private async applyTreeLinks(mitra: MitraDocument): Promise<void> {
    if (mitra.status !== MitraStatus.APPROVED) return;

    const mode = mitra.treeAssignment || MitraTreeAssignment.NONE;
    if (mode === MitraTreeAssignment.NONE || !mitra.landId) return;

    const link = {
      assignedMitraId: mitra._id,
      assignedMitraName: mitra.name,
    };

    if (mode === MitraTreeAssignment.ALL) {
      await this.treeModel
        .updateMany({ landId: mitra.landId }, { $set: link })
        .exec();
      return;
    }

    if (mode === MitraTreeAssignment.SINGLE && mitra.assignedTreeId) {
      const tree = await this.treeModel.findById(mitra.assignedTreeId).exec();
      if (!tree) {
        throw new NotFoundException(
          `Tree "${String(mitra.assignedTreeId)}" not found`,
        );
      }
      if (
        tree.landId &&
        String(tree.landId) !== String(mitra.landId)
      ) {
        throw new BadRequestException(
          'Selected tree does not belong to the assigned land',
        );
      }
      await this.treeModel
        .updateOne({ _id: mitra.assignedTreeId }, { $set: link })
        .exec();
    }
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
    await this.applyTreeLinks(updated as MitraDocument);
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
