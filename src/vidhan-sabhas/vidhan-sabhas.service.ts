import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { normalizeBoundaryInput } from '../common/utils/geo.util';
import { PaginationUtil } from '../common/utils/pagination.util';
import { LandsService } from '../lands/lands.service';
import { Tree, TreeDocument } from '../trees/schemas/tree.schema';
import { CreateVidhanSabhaDto } from './dto/create-vidhan-sabha.dto';
import { UpdateVidhanSabhaDto } from './dto/update-vidhan-sabha.dto';
import { VidhanSabhaQueryDto } from './dto/vidhan-sabha-query.dto';
import { VidhanSabhaRepository } from './repositories/vidhan-sabha.repository';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from './schemas/vidhan-sabha.schema';

export type VidhanSabhaWithLandStats = VidhanSabha & {
  governmentLandAcres?: number;
  privateLandAcres?: number;
  remainingPlantationCapacity?: number;
  estimatedOxygenTonsPerYear?: number;
};

@Injectable()
export class VidhanSabhasService implements OnModuleInit {
  constructor(
    private readonly vidhanSabhaRepository: VidhanSabhaRepository,
    @InjectModel(Tree.name) private readonly treeModel: Model<TreeDocument>,
    private readonly landsService: LandsService,
  ) {}

  async onModuleInit() {
    // Keep constituency tree/O₂ counters in sync with live tree docs
    await this.refreshAllTreeOxygenStats();
  }

  private async refreshAllTreeOxygenStats() {
    const groups = await this.treeModel.aggregate<{
      _id: string;
      totalTrees: number;
      totalAnnualOxygenKg: number;
    }>([
      {
        $match: {
          vidhanSabha: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: '$vidhanSabha',
          totalTrees: { $sum: 1 },
          totalAnnualOxygenKg: {
            $sum: { $ifNull: ['$annualOxygenProductionKg', 0] },
          },
        },
      },
    ]);

    const byName = new Map(
      groups.map((g) => [
        g._id,
        {
          totalTrees: g.totalTrees,
          totalAnnualOxygenKg: g.totalAnnualOxygenKg,
        },
      ]),
    );

    const all = await this.vidhanSabhaRepository.findPaginated(
      { page: 1, limit: 500, sortBy: 'vidhanSabhaName', sortOrder: 'asc' },
      {},
      [],
    );

    for (const vs of all.items) {
      const stats = byName.get(vs.vidhanSabhaName) || {
        totalTrees: 0,
        totalAnnualOxygenKg: 0,
      };
      await this.vidhanSabhaRepository.updateById(String((vs as any)._id), {
        totalTrees: stats.totalTrees,
        totalAnnualOxygenKg: stats.totalAnnualOxygenKg,
      } as Partial<VidhanSabhaDocument>);
    }
  }

  async create(dto: CreateVidhanSabhaDto): Promise<VidhanSabha> {
    const exists = await this.vidhanSabhaRepository.existsByName(
      dto.vidhanSabhaName,
    );
    if (exists) {
      throw new ConflictException(
        `A Vidhan Sabha named "${dto.vidhanSabhaName}" already exists`,
      );
    }
    const boundary = normalizeBoundaryInput(dto.boundary);
    const created = await this.vidhanSabhaRepository.create({
      ...dto,
      country: dto.country?.trim() || 'India',
      ...(boundary ? { boundary } : { boundary: undefined }),
    } as unknown as Partial<VidhanSabhaDocument>);

    if (boundary) {
      await this.landsService.remapAllLandsWithCoordinates();
    }
    return created;
  }

  private async attachLandStats(
    entry: VidhanSabha,
  ): Promise<VidhanSabhaWithLandStats> {
    const plain =
      typeof (entry as any).toObject === 'function'
        ? (entry as any).toObject()
        : { ...(entry as any) };
    const land = await this.landsService.statsForVidhanSabha(
      plain.vidhanSabhaName,
      String(plain._id),
    );
    const oxygenKg = Number(plain.totalAnnualOxygenKg || 0);
    return {
      ...plain,
      governmentLandAcres: land.governmentAreaAcres,
      privateLandAcres: land.privateAreaAcres,
      remainingPlantationCapacity: land.remainingPlantationCapacity,
      estimatedOxygenTonsPerYear:
        Math.round((oxygenKg / 1000) * 100) / 100,
    };
  }

  async findAll(
    query: VidhanSabhaQueryDto,
  ): Promise<PaginatedResult<VidhanSabhaWithLandStats>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.district !== undefined) {
      baseFilter.district = query.district;
    }
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    const result = await this.vidhanSabhaRepository.findPaginated(
      options,
      baseFilter,
      ['vidhanSabhaName', 'district', 'state', 'assignedAdmin'],
    );

    const items = await Promise.all(
      result.items.map((item) => this.attachLandStats(item)),
    );
    return { items, meta: result.meta };
  }

  async findOne(id: string): Promise<VidhanSabhaWithLandStats> {
    const entry = await this.vidhanSabhaRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
    return this.attachLandStats(entry);
  }

  async update(
    id: string,
    dto: UpdateVidhanSabhaDto,
  ): Promise<VidhanSabha> {
    if (dto.vidhanSabhaName !== undefined) {
      const exists = await this.vidhanSabhaRepository.existsByName(
        dto.vidhanSabhaName,
        id,
      );
      if (exists) {
        throw new ConflictException(
          `Another Vidhan Sabha already uses the name "${dto.vidhanSabhaName}"`,
        );
      }
    }

    const patch: Record<string, unknown> = { ...dto };
    if (dto.boundary !== undefined) {
      const boundary = normalizeBoundaryInput(dto.boundary);
      if (boundary) {
        patch.boundary = boundary;
      } else if (dto.boundary === null || dto.boundary === '') {
        patch.boundary = null;
      } else {
        delete patch.boundary;
      }
    }

    const updated = await this.vidhanSabhaRepository.updateById(
      id,
      patch as unknown as Partial<VidhanSabhaDocument>,
    );
    if (dto.boundary !== undefined) {
      await this.landsService.remapAllLandsWithCoordinates();
    }
    if (!updated) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.vidhanSabhaRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
  }
}
