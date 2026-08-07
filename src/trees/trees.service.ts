import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { LandsService } from '../lands/lands.service';
import {
  Mitra,
  MitraDocument,
  MitraStatus,
} from '../mitras/schemas/mitra.schema';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { AssignMitraDto } from './dto/assign-mitra.dto';
import { CreateTreeDto } from './dto/create-tree.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { oxygenToCo2Kg } from '../common/utils/carbon.util';
import { Tree, TreeDocument } from './schemas/tree.schema';
import { computeTreeOxygen } from './utils/oxygen.util';

@Injectable()
export class TreesService {
  constructor(
    @InjectModel(Tree.name) private treeModel: Model<TreeDocument>,
    @InjectModel(Mitra.name) private mitraModel: Model<MitraDocument>,
    @InjectModel(VidhanSabha.name)
    private vidhanSabhaModel: Model<VidhanSabhaDocument>,
    @Inject(forwardRef(() => LandsService))
    private readonly landsService: LandsService,
    @InjectConnection() private connection: Connection,
  ) {}

  private async generateTreeId(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'treeId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `TR-${seq.toString().padStart(4, '0')}`;
  }

  private applyOxygenFields(data: {
    species?: string;
    plantedDate?: Date | string;
    height?: number;
    dbh?: number;
    status?: string;
  }) {
    const calc = computeTreeOxygen({
      species: data.species,
      plantedDate: data.plantedDate,
      heightM: data.height,
      dbhCm: data.dbh,
      status: data.status,
    });
    return {
      treeAgeYears: calc.treeAgeYears,
      annualOxygenProductionKg: calc.annualOxygenProductionKg,
    };
  }

  /** Recompute totalTrees + totalAnnualOxygenKg for one (or all) Vidhan Sabhas. */
  async syncVidhanSabhaTreeStats(vidhanSabhaName?: string | null) {
    const match: Record<string, unknown> = {
      vidhanSabha: { $exists: true, $nin: [null, ''] },
    };
    if (vidhanSabhaName) {
      match.vidhanSabha = vidhanSabhaName;
    }

    const groups = await this.treeModel.aggregate<{
      _id: string;
      totalTrees: number;
      totalAnnualOxygenKg: number;
    }>([
      { $match: match },
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

    if (vidhanSabhaName) {
      const row = groups.find((g) => g._id === vidhanSabhaName);
      await this.vidhanSabhaModel
        .updateOne(
          { vidhanSabhaName, isDeleted: false },
          {
            $set: {
              totalTrees: row?.totalTrees ?? 0,
              totalAnnualOxygenKg: row?.totalAnnualOxygenKg ?? 0,
            },
          },
        )
        .exec();
      return;
    }

    for (const row of groups) {
      await this.vidhanSabhaModel
        .updateOne(
          { vidhanSabhaName: row._id, isDeleted: false },
          {
            $set: {
              totalTrees: row.totalTrees,
              totalAnnualOxygenKg: row.totalAnnualOxygenKg,
            },
          },
        )
        .exec();
    }
  }

  private async syncLandCounts(...landIds: Array<string | null | undefined>) {
    const unique = [...new Set(landIds.filter(Boolean) as string[])];
    for (const id of unique) {
      await this.landsService.syncPlantedTrees(id);
    }
  }

  async create(createTreeDto: CreateTreeDto): Promise<Tree> {
    const treeId = await this.generateTreeId();
    const oxygen = this.applyOxygenFields(createTreeDto);

    let landName = createTreeDto.landName;
    let vidhanSabha = createTreeDto.vidhanSabha;
    let state = createTreeDto.state;
    let district = createTreeDto.district;
    let city = createTreeDto.city;
    if (createTreeDto.landId) {
      try {
        const land = await this.landsService.findOne(createTreeDto.landId);
        landName = landName || land.landName;
        // Inherit geo hierarchy via land (VS is auto-mapped on land, not a parent)
        vidhanSabha = land.vidhanSabha || vidhanSabha;
        state = land.state || state;
        district = land.district || district;
        city = land.villageOrCity || land.village || city;
      } catch {
        // land optional — ignore if missing
      }
    }

    const mitraLink = await this.resolveMitraLink(createTreeDto.assignedMitraId);

    const createdTree = new this.treeModel({
      ...createTreeDto,
      landName,
      vidhanSabha,
      state,
      district,
      city,
      treeId,
      plantedBy: createTreeDto.plantedBy || mitraLink?.name || undefined,
      assignedMitraId: mitraLink?.id ?? null,
      assignedMitraName: mitraLink?.name ?? null,
      ...oxygen,
    });
    const saved = await createdTree.save();
    if (saved.vidhanSabha) {
      await this.syncVidhanSabhaTreeStats(saved.vidhanSabha);
    }
    if (saved.landId) {
      await this.syncLandCounts(String(saved.landId));
    }
    return saved;
  }

  private async resolveMitraLink(
    mitraId?: string,
  ): Promise<{ id: MitraDocument['_id']; name: string } | null> {
    if (!mitraId) return null;
    const mitra = await this.mitraModel
      .findOne({ _id: mitraId, isDeleted: false })
      .exec();
    if (!mitra) {
      throw new NotFoundException(`Mitra with ID "${mitraId}" not found`);
    }
    if (mitra.status !== MitraStatus.APPROVED) {
      throw new BadRequestException(
        `Mitra "${mitra.name}" is not Approved yet and cannot be assigned to trees`,
      );
    }
    return { id: mitra._id, name: mitra.name };
  }

  async findAll(): Promise<Tree[]> {
    return this.treeModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByTreeId(treeId: string): Promise<Tree | null> {
    return this.treeModel
      .findOne({ treeId: String(treeId).trim() })
      .exec();
  }

  async findOne(id: string): Promise<Tree> {
    const tree = await this.treeModel.findById(id).exec();
    if (!tree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }
    return tree;
  }

  /**
   * Citizen analytics snapshot for a single tree.
   * Progress: blend of age (years/10 capped) + height (m/5 capped).
   */
  async getAnalytics(id: string) {
    const tree = await this.findOne(id);
    const oxygenKg = tree.annualOxygenProductionKg ?? 0;
    const ageYears = tree.treeAgeYears ?? 0;
    const heightM = Number(tree.height) || 0;
    const ageScore = Math.min(1, ageYears / 10);
    const heightScore = Math.min(1, heightM / 5);
    const progress = Math.round(((ageScore + heightScore) / 2) * 100);

    return {
      treeId: tree.treeId,
      species: tree.species || tree.treeName,
      status: tree.status,
      plantedDate: tree.plantedDate,
      height: tree.height ?? null,
      oxygenKg,
      co2Kg: oxygenToCo2Kg(oxygenKg),
      monthlyPhotos: tree.image ? [tree.image] : [],
      progress,
      vehicleNumber: tree.vehicleNumber || null,
      vidhanSabha: tree.vidhanSabha || null,
      treeAgeYears: ageYears,
    };
  }

  async findByUserMobile(mobile: string): Promise<any[]> {
    const digits = String(mobile || '').replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const variants = Array.from(
      new Set(
        [mobile, digits, last10, last10 ? `91${last10}` : '', last10 ? `+91${last10}` : '']
          .map(v => String(v || '').trim())
          .filter(Boolean),
      ),
    );

    const trees = await this.treeModel
      .find({ mobile: { $in: variants } })
      .exec();

    const grouped = trees.reduce(
      (acc, tree) => {
        const vehicleKey = tree.vehicleNumber || 'No_Vehicle';
        if (!acc[vehicleKey]) {
          acc[vehicleKey] = {
            vehicleNumber: vehicleKey,
            trees: [],
          };
        }
        acc[vehicleKey].trees.push(tree);
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(grouped);
  }

  async update(id: string, updateTreeDto: UpdateTreeDto): Promise<Tree> {
    const existing = await this.treeModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }

    const previousVs = existing.vidhanSabha;
    const previousLandId = existing.landId
      ? String(existing.landId)
      : undefined;
    const merged = {
      species: updateTreeDto.species ?? existing.species,
      plantedDate: updateTreeDto.plantedDate ?? existing.plantedDate,
      height: updateTreeDto.height ?? existing.height,
      dbh:
        updateTreeDto.dbh !== undefined
          ? updateTreeDto.dbh
          : existing.dbh ?? undefined,
      status: updateTreeDto.status ?? existing.status,
    };
    const oxygen = this.applyOxygenFields(merged);

    let patch: Record<string, unknown> = { ...updateTreeDto, ...oxygen };
    if (updateTreeDto.landId) {
      try {
        const land = await this.landsService.findOne(updateTreeDto.landId);
        patch.landName = updateTreeDto.landName || land.landName;
        // Always cascade location from land when land is (re)selected
        if (land.vidhanSabha) patch.vidhanSabha = land.vidhanSabha;
        if (land.state) patch.state = land.state;
        if (land.district) patch.district = land.district;
        const locality = land.villageOrCity || land.village;
        if (locality) patch.city = locality;
      } catch {
        // ignore
      }
    }

    if (updateTreeDto.assignedMitraId !== undefined) {
      if (!updateTreeDto.assignedMitraId) {
        patch.assignedMitraId = null;
        patch.assignedMitraName = null;
      } else {
        const mitraLink = await this.resolveMitraLink(
          updateTreeDto.assignedMitraId,
        );
        patch.assignedMitraId = mitraLink?.id ?? null;
        patch.assignedMitraName = mitraLink?.name ?? null;
        if (!updateTreeDto.plantedBy && mitraLink?.name) {
          patch.plantedBy = mitraLink.name;
        }
      }
    }

    const existingTree = await this.treeModel
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
    if (!existingTree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }

    const nextVs = existingTree.vidhanSabha;
    if (previousVs && previousVs !== nextVs) {
      await this.syncVidhanSabhaTreeStats(previousVs);
    }
    if (nextVs) {
      await this.syncVidhanSabhaTreeStats(nextVs);
    }

    const nextLandId = existingTree.landId
      ? String(existingTree.landId)
      : undefined;
    await this.syncLandCounts(previousLandId, nextLandId);

    return existingTree;
  }

  async assignMitra(id: string, dto: AssignMitraDto): Promise<Tree> {
    const mitra = await this.mitraModel
      .findOne({ _id: dto.mitraId, isDeleted: false })
      .exec();
    if (!mitra) {
      throw new NotFoundException(`Mitra with ID "${dto.mitraId}" not found`);
    }
    if (mitra.status !== MitraStatus.APPROVED) {
      throw new BadRequestException(
        `Mitra "${mitra.name}" is not Approved yet and cannot be assigned to trees`,
      );
    }

    const updatedTree = await this.treeModel
      .findByIdAndUpdate(
        id,
        { assignedMitraId: mitra._id, assignedMitraName: mitra.name },
        { new: true },
      )
      .exec();
    if (!updatedTree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }
    return updatedTree;
  }

  async remove(id: string): Promise<Tree> {
    const deletedTree = await this.treeModel.findByIdAndDelete(id).exec();
    if (!deletedTree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }
    if (deletedTree.vidhanSabha) {
      await this.syncVidhanSabhaTreeStats(deletedTree.vidhanSabha);
    }
    if (deletedTree.landId) {
      await this.syncLandCounts(String(deletedTree.landId));
    }
    return deletedTree;
  }
}
