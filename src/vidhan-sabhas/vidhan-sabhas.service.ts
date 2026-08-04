import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import {
  acresToKm2,
  computeBoundaryMetrics,
  normalizeBoundaryInput,
} from '../common/utils/geo.util';
import { PaginationUtil } from '../common/utils/pagination.util';
import { GeoService } from '../geo/geo.service';
import { LandsService } from '../lands/lands.service';
import {
  Plantation,
  PlantationDocument,
  PlantationStatus,
} from '../plantations/schemas/plantation.schema';
import { Tree, TreeDocument } from '../trees/schemas/tree.schema';
import { CreateVidhanSabhaDto } from './dto/create-vidhan-sabha.dto';
import { UpdateVidhanSabhaDto } from './dto/update-vidhan-sabha.dto';
import { VidhanSabhaQueryDto } from './dto/vidhan-sabha-query.dto';
import { VidhanSabhaRepository } from './repositories/vidhan-sabha.repository';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from './schemas/vidhan-sabha.schema';

export type VidhanSabhaListItem = VidhanSabha & {
  hasBoundary: boolean;
  areaKm2: number | null;
  perimeterKm: number | null;
  greenCoverPercent: number | null;
  totalLands: number;
  pendingPlantationRequests: number;
  governmentLandAcres?: number;
  privateLandAcres?: number;
  remainingPlantationCapacity?: number;
  estimatedOxygenTonsPerYear?: number;
  estimatedCo2TonsPerYear?: number;
  villageCount?: number;
};

@Injectable()
export class VidhanSabhasService implements OnModuleInit {
  constructor(
    private readonly vidhanSabhaRepository: VidhanSabhaRepository,
    @InjectModel(Tree.name) private readonly treeModel: Model<TreeDocument>,
    @InjectModel(Plantation.name)
    private readonly plantationModel: Model<PlantationDocument>,
    private readonly landsService: LandsService,
    private readonly geoService: GeoService,
  ) {}

  async onModuleInit() {
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

  private boundaryPatch(boundaryInput: unknown): {
    boundary?: ReturnType<typeof normalizeBoundaryInput> | null;
    areaKm2?: number | null;
    perimeterKm?: number | null;
  } {
    if (boundaryInput === null || boundaryInput === '') {
      return { boundary: null, areaKm2: null, perimeterKm: null };
    }
    const boundary = normalizeBoundaryInput(boundaryInput);
    if (!boundary) {
      return {};
    }
    const metrics = computeBoundaryMetrics(boundary);
    return {
      boundary,
      areaKm2: metrics?.areaKm2 ?? null,
      perimeterKm: metrics?.perimeterKm ?? null,
    };
  }

  async create(dto: CreateVidhanSabhaDto): Promise<VidhanSabha> {
    let masterId = dto.masterId?.trim();
    let vidhanSabhaName = dto.vidhanSabhaName?.trim();
    let country = dto.country?.trim() || 'India';
    let state = dto.state?.trim();
    let district = dto.district?.trim();
    let boundaryInput = dto.boundary;

    if (masterId) {
      const master = await this.geoService.findConstituencyById(masterId);
      if (!master) {
        throw new BadRequestException(
          `Unknown masterId "${masterId}" — not in master_constituencies. Run: pnpm run seed:master`,
        );
      }
      vidhanSabhaName = vidhanSabhaName || master.name;
      country = master.country || country;
      state = state || master.state;
      district = district || master.district;
      if (boundaryInput === undefined && master.boundary) {
        boundaryInput = master.boundary;
      }
    }

    if (!vidhanSabhaName) {
      throw new BadRequestException(
        'Provide masterId or vidhanSabhaName',
      );
    }

    const exists = await this.vidhanSabhaRepository.existsByName(
      vidhanSabhaName,
    );
    if (exists) {
      throw new ConflictException(
        `A Vidhan Sabha named "${vidhanSabhaName}" already exists`,
      );
    }

    if (masterId) {
      const byMaster = await this.vidhanSabhaRepository.findByMasterId(masterId);
      if (byMaster) {
        throw new ConflictException(
          `Vidhan Sabha with masterId "${masterId}" already exists`,
        );
      }
    }

    const geo = this.boundaryPatch(boundaryInput);
    const created = await this.vidhanSabhaRepository.create({
      ...dto,
      masterId: masterId || undefined,
      vidhanSabhaName,
      country,
      state,
      district,
      ...geo,
    } as unknown as Partial<VidhanSabhaDocument>);

    if (geo.boundary) {
      await this.landsService.remapAllLandsWithCoordinates();
    }
    return created;
  }

  private async countPendingPlantations(vidhanSabhaName: string): Promise<number> {
    if (!vidhanSabhaName) return 0;
    return this.plantationModel
      .countDocuments({
        isDeleted: false,
        status: PlantationStatus.PENDING,
        vidhanSabha: vidhanSabhaName,
      })
      .exec();
  }

  private computeGreenCoverPercent(
    areaKm2: number | null,
    governmentAcres: number,
    privateAcres: number,
    plantedTrees: number,
    maxTreeCapacity: number,
  ): number | null {
    // Prefer plantation capacity fill rate when lands exist
    if (maxTreeCapacity > 0) {
      return Math.min(
        100,
        Math.round((plantedTrees / maxTreeCapacity) * 1000) / 10,
      );
    }
    // Fallback: registered land area vs constituency polygon area
    if (areaKm2 && areaKm2 > 0) {
      const landKm2 = acresToKm2(governmentAcres + privateAcres);
      return Math.min(100, Math.round((landKm2 / areaKm2) * 1000) / 10);
    }
    return null;
  }

  private async attachStats(entry: VidhanSabha): Promise<VidhanSabhaListItem> {
    const plain =
      typeof (entry as any).toObject === 'function'
        ? (entry as any).toObject()
        : { ...(entry as any) };

    const hasBoundary = !!(
      plain.boundary?.type &&
      plain.boundary?.coordinates &&
      Array.isArray(plain.boundary.coordinates) &&
      plain.boundary.coordinates.length > 0
    );

    let areaKm2: number | null =
      plain.areaKm2 != null ? Number(plain.areaKm2) : null;
    let perimeterKm: number | null =
      plain.perimeterKm != null ? Number(plain.perimeterKm) : null;

    if (hasBoundary && (areaKm2 == null || perimeterKm == null)) {
      const metrics = computeBoundaryMetrics(plain.boundary);
      if (metrics) {
        areaKm2 = metrics.areaKm2;
        perimeterKm = metrics.perimeterKm;
        // Best-effort cache backfill (ignore errors)
        void this.vidhanSabhaRepository.updateById(String(plain._id), {
          areaKm2,
          perimeterKm,
        } as Partial<VidhanSabhaDocument>);
      }
    }

    const land = await this.landsService.statsForVidhanSabha(
      plain.vidhanSabhaName,
      String(plain._id),
    );
    const pendingPlantationRequests = await this.countPendingPlantations(
      plain.vidhanSabhaName,
    );

    const oxygenKg = Number(plain.totalAnnualOxygenKg || 0);
    const estimatedOxygenTonsPerYear =
      Math.round((oxygenKg / 1000) * 100) / 100;
    // Photosynthesis mass ratio CO₂:O₂ ≈ 44:32
    const estimatedCo2TonsPerYear =
      Math.round(((oxygenKg * 44) / 32 / 1000) * 100) / 100;

    const greenCoverPercent = this.computeGreenCoverPercent(
      areaKm2,
      land.governmentAreaAcres,
      land.privateAreaAcres,
      land.plantedTrees,
      land.maxTreeCapacity,
    );

    return {
      ...plain,
      hasBoundary,
      areaKm2: hasBoundary ? areaKm2 : null,
      perimeterKm: hasBoundary ? perimeterKm : null,
      greenCoverPercent,
      totalLands: land.totalLand,
      pendingPlantationRequests,
      governmentLandAcres: land.governmentAreaAcres,
      privateLandAcres: land.privateAreaAcres,
      remainingPlantationCapacity: land.remainingPlantationCapacity,
      estimatedOxygenTonsPerYear,
      estimatedCo2TonsPerYear,
      villageCount: land.villageCount,
    };
  }

  async findAll(
    query: VidhanSabhaQueryDto,
  ): Promise<PaginatedResult<VidhanSabhaListItem>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (query.district !== undefined && query.district.trim()) {
      baseFilter.district = {
        $regex: `^${escapeRegex(query.district.trim())}$`,
        $options: 'i',
      };
    }
    if (query.state !== undefined && query.state.trim()) {
      baseFilter.state = {
        $regex: `^${escapeRegex(query.state.trim())}$`,
        $options: 'i',
      };
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
      result.items.map((item) => this.attachStats(item)),
    );
    return { items, meta: result.meta };
  }

  async findOne(id: string): Promise<VidhanSabhaListItem> {
    const entry = await this.vidhanSabhaRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
    return this.attachStats(entry);
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
      const geo = this.boundaryPatch(dto.boundary);
      if (geo.boundary === null) {
        patch.boundary = null;
        patch.areaKm2 = null;
        patch.perimeterKm = null;
      } else if (geo.boundary) {
        Object.assign(patch, geo);
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
