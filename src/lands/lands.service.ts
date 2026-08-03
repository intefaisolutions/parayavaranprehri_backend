import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { buildPoint } from '../common/utils/geo.util';
import { Tree, TreeDocument } from '../trees/schemas/tree.schema';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { CreateLandDto } from './dto/create-land.dto';
import { LandQueryDto } from './dto/land-query.dto';
import { UpdateLandDto } from './dto/update-land.dto';
import {
  Land,
  LandDocument,
  LandOwnershipType,
  LandStatus,
} from './schemas/land.schema';
import {
  AreaUnit,
  computeAvailableCapacity,
  deriveLandStatus,
  recommendMaxTreeCapacity,
  toAcres,
} from './utils/land-capacity.util';

export interface OwnershipDashboardCard {
  ownershipType: LandOwnershipType | string;
  totalLand: number;
  totalAreaAcres: number;
  treeCapacity: number;
  treesPlanted: number;
  remainingCapacity: number;
}

@Injectable()
export class LandsService {
  constructor(
    @InjectModel(Land.name) private readonly landModel: Model<LandDocument>,
    @InjectModel(Tree.name) private readonly treeModel: Model<TreeDocument>,
    @InjectModel(VidhanSabha.name)
    private readonly vidhanSabhaModel: Model<VidhanSabhaDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateLandId(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'landId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `LD-${seq.toString().padStart(6, '0')}`;
  }

  private buildCapacityFields(
    dto: {
      totalArea: number;
      areaUnit: AreaUnit;
      maxTreeCapacity?: number;
      maxCapacityManual?: boolean;
      status?: LandStatus | string;
    },
    plantedTrees = 0,
  ) {
    const totalAreaAcres = toAcres(dto.totalArea, dto.areaUnit);
    const recommended = recommendMaxTreeCapacity(dto.totalArea, dto.areaUnit);
    const manual =
      dto.maxCapacityManual === true ||
      (dto.maxTreeCapacity != null &&
        dto.maxTreeCapacity !== recommended &&
        dto.maxTreeCapacity > 0);
    const maxTreeCapacity =
      dto.maxTreeCapacity != null && dto.maxTreeCapacity >= 0
        ? Math.floor(dto.maxTreeCapacity)
        : recommended;
    const availableCapacity = computeAvailableCapacity(
      maxTreeCapacity,
      plantedTrees,
    );
    const status = deriveLandStatus(
      dto.status,
      maxTreeCapacity,
      plantedTrees,
    ) as LandStatus;

    return {
      totalAreaAcres: Math.round(totalAreaAcres * 1000) / 1000,
      maxTreeCapacity,
      maxCapacityManual: manual,
      plantedTrees,
      availableCapacity,
      status,
      recommendedMaxTreeCapacity: recommended,
    };
  }

  /**
   * Find Vidhan Sabha whose GeoJSON boundary contains the land point.
   * Optionally prefer same district when multiple polygons overlap.
   */
  async resolveVidhanSabhaFromPoint(
    longitude: number,
    latitude: number,
    district?: string,
  ): Promise<{ id: Types.ObjectId; name: string } | null> {
    const point = buildPoint(longitude, latitude);
    const filter: Record<string, unknown> = {
      isDeleted: false,
      boundary: {
        $geoIntersects: {
          $geometry: point,
        },
      },
    };
    if (district) {
      filter.district = district;
    }

    let vs = await this.vidhanSabhaModel.findOne(filter as any).exec();
    if (!vs && district) {
      // Fallback: any constituency polygon containing the point
      vs = await this.vidhanSabhaModel
        .findOne({
          isDeleted: false,
          boundary: { $geoIntersects: { $geometry: point } },
        } as any)
        .exec();
    }
    if (!vs) return null;
    return { id: vs._id as Types.ObjectId, name: vs.vidhanSabhaName };
  }

  private async buildGeoAndMappingFields(input: {
    latitude?: number | null;
    longitude?: number | null;
    district?: string;
  }): Promise<{
    latitude?: number;
    longitude?: number;
    location?: { type: 'Point'; coordinates: [number, number] } | null;
    vidhanSabhaId?: Types.ObjectId | null;
    vidhanSabha?: string | null;
  }> {
    const lat = input.latitude;
    const lng = input.longitude;
    if (
      lat == null ||
      lng == null ||
      Number.isNaN(Number(lat)) ||
      Number.isNaN(Number(lng))
    ) {
      return {
        location: null,
        vidhanSabhaId: null,
        vidhanSabha: null,
      };
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const location = buildPoint(longitude, latitude);
    const mapped = await this.resolveVidhanSabhaFromPoint(
      longitude,
      latitude,
      input.district,
    );

    return {
      latitude,
      longitude,
      location,
      vidhanSabhaId: mapped?.id ?? null,
      vidhanSabha: mapped?.name ?? null,
    };
  }

  /** Remap all lands that have coordinates (e.g. after VS boundary create/update). */
  async remapAllLandsWithCoordinates(): Promise<number> {
    const lands = await this.landModel
      .find({
        isDeleted: false,
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
      } as any)
      .select('_id latitude longitude district')
      .lean()
      .exec();

    let updated = 0;
    for (const land of lands) {
      const geo = await this.buildGeoAndMappingFields({
        latitude: land.latitude,
        longitude: land.longitude,
        district: land.district,
      });
      await this.landModel.updateOne(
        { _id: land._id },
        {
          $set: {
            location: geo.location,
            vidhanSabhaId: geo.vidhanSabhaId,
            vidhanSabha: geo.vidhanSabha,
          },
        },
      );
      updated += 1;
    }
    return updated;
  }

  private normalizeLocality(dto: CreateLandDto | UpdateLandDto) {
    const villageOrCity =
      (dto as CreateLandDto).villageOrCity?.trim() ||
      (dto as CreateLandDto).village?.trim() ||
      undefined;
    return {
      country: (dto as CreateLandDto).country?.trim() || 'India',
      villageOrCity,
      village: villageOrCity,
    };
  }

  async create(dto: CreateLandDto): Promise<Land> {
    const landId = await this.generateLandId();
    const capacity = this.buildCapacityFields(
      {
        totalArea: dto.totalArea,
        areaUnit: dto.areaUnit as AreaUnit,
        maxTreeCapacity: dto.maxTreeCapacity,
        maxCapacityManual: dto.maxCapacityManual,
        status: dto.status,
      },
      0,
    );
    const locality = this.normalizeLocality(dto);
    const geo = await this.buildGeoAndMappingFields({
      latitude: dto.latitude,
      longitude: dto.longitude,
      district: dto.district,
    });

    const created = new this.landModel({
      ...dto,
      ...locality,
      ...geo,
      landId,
      ...capacity,
    });
    return created.save();
  }

  async findAll(query: LandQueryDto = {}): Promise<Land[]> {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.ownershipType) filter.ownershipType = query.ownershipType;
    if (query.status) filter.status = query.status;
    if (query.vidhanSabha) filter.vidhanSabha = query.vidhanSabha;
    if (query.state) filter.state = query.state;
    if (query.district) filter.district = query.district;
    if (query.search) {
      filter.$or = [
        { landName: { $regex: query.search, $options: 'i' } },
        { khasraNumber: { $regex: query.search, $options: 'i' } },
        { villageOrCity: { $regex: query.search, $options: 'i' } },
        { village: { $regex: query.search, $options: 'i' } },
        { landAddress: { $regex: query.search, $options: 'i' } },
        { landmark: { $regex: query.search, $options: 'i' } },
        { pinCode: { $regex: query.search, $options: 'i' } },
        { landId: { $regex: query.search, $options: 'i' } },
        { ownerName: { $regex: query.search, $options: 'i' } },
        { tehsil: { $regex: query.search, $options: 'i' } },
      ];
    }
    return this.landModel.find(filter as any).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Land> {
    const land = await this.landModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!land) throw new NotFoundException(`Land "${id}" not found`);
    return land;
  }

  async update(id: string, dto: UpdateLandDto): Promise<Land> {
    const existing = await this.findOne(id);
    const plantedTrees = existing.plantedTrees ?? 0;

    const totalArea = dto.totalArea ?? existing.totalArea;
    const areaUnit = (dto.areaUnit ?? existing.areaUnit) as AreaUnit;
    const capacity = this.buildCapacityFields(
      {
        totalArea,
        areaUnit,
        maxTreeCapacity:
          dto.maxTreeCapacity !== undefined
            ? dto.maxTreeCapacity
            : existing.maxTreeCapacity,
        maxCapacityManual:
          dto.maxCapacityManual !== undefined
            ? dto.maxCapacityManual
            : existing.maxCapacityManual,
        status: dto.status ?? existing.status,
      },
      plantedTrees,
    );

    const locality = this.normalizeLocality(dto);
    const lat =
      dto.latitude !== undefined ? dto.latitude : existing.latitude;
    const lng =
      dto.longitude !== undefined ? dto.longitude : existing.longitude;
    const district = dto.district ?? existing.district;
    const shouldRemap =
      dto.latitude !== undefined ||
      dto.longitude !== undefined ||
      dto.district !== undefined;

    const geo = shouldRemap
      ? await this.buildGeoAndMappingFields({
          latitude: lat,
          longitude: lng,
          district,
        })
      : {};

    const updated = await this.landModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          ...dto,
          ...(locality.villageOrCity !== undefined
            ? {
                villageOrCity: locality.villageOrCity,
                village: locality.village,
              }
            : {}),
          ...(dto.country !== undefined
            ? { country: locality.country }
            : {}),
          ...geo,
          ...capacity,
        },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(`Land "${id}" not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.landModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) throw new NotFoundException(`Land "${id}" not found`);
  }

  /** Recount planted trees from Tree collection and refresh capacity/status. */
  async syncPlantedTrees(landId: string): Promise<Land | null> {
    const land = await this.landModel
      .findOne({ _id: landId, isDeleted: false })
      .exec();
    if (!land) return null;

    const plantedTrees = await this.treeModel
      .countDocuments({ landId, status: { $ne: 'DEAD' } })
      .exec();

    const availableCapacity = computeAvailableCapacity(
      land.maxTreeCapacity,
      plantedTrees,
    );
    const status = deriveLandStatus(
      land.status,
      land.maxTreeCapacity,
      plantedTrees,
    ) as LandStatus;

    land.plantedTrees = plantedTrees;
    land.availableCapacity = availableCapacity;
    land.status = status;
    return land.save();
  }

  async dashboardByOwnership(): Promise<OwnershipDashboardCard[]> {
    const groups = await this.landModel.aggregate<{
      _id: string;
      totalLand: number;
      totalAreaAcres: number;
      treeCapacity: number;
      treesPlanted: number;
      remainingCapacity: number;
    }>([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$ownershipType',
          totalLand: { $sum: 1 },
          totalAreaAcres: { $sum: { $ifNull: ['$totalAreaAcres', 0] } },
          treeCapacity: { $sum: { $ifNull: ['$maxTreeCapacity', 0] } },
          treesPlanted: { $sum: { $ifNull: ['$plantedTrees', 0] } },
          remainingCapacity: {
            $sum: { $ifNull: ['$availableCapacity', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return groups.map((g) => ({
      ownershipType: g._id,
      totalLand: g.totalLand,
      totalAreaAcres: Math.round(g.totalAreaAcres * 100) / 100,
      treeCapacity: g.treeCapacity,
      treesPlanted: g.treesPlanted,
      remainingCapacity: g.remainingCapacity,
    }));
  }

  async statsForVidhanSabha(
    vidhanSabha: string,
    vidhanSabhaId?: string,
  ): Promise<{
    governmentAreaAcres: number;
    privateAreaAcres: number;
    totalTrees: number;
    remainingPlantationCapacity: number;
    totalLand: number;
  }> {
    const or: Record<string, unknown>[] = [{ vidhanSabha }];
    if (vidhanSabhaId && Types.ObjectId.isValid(vidhanSabhaId)) {
      or.push({ vidhanSabhaId: new Types.ObjectId(vidhanSabhaId) });
    }
    const lands = await this.landModel
      .find({ isDeleted: false, $or: or })
      .select(
        'ownershipType totalAreaAcres plantedTrees availableCapacity',
      )
      .lean()
      .exec();

    let governmentAreaAcres = 0;
    let privateAreaAcres = 0;
    let totalTrees = 0;
    let remainingPlantationCapacity = 0;

    for (const land of lands) {
      const acres = land.totalAreaAcres || 0;
      if (land.ownershipType === LandOwnershipType.GOVERNMENT) {
        governmentAreaAcres += acres;
      } else if (land.ownershipType === LandOwnershipType.PRIVATE) {
        privateAreaAcres += acres;
      }
      totalTrees += land.plantedTrees || 0;
      remainingPlantationCapacity += land.availableCapacity || 0;
    }

    return {
      governmentAreaAcres: Math.round(governmentAreaAcres * 100) / 100,
      privateAreaAcres: Math.round(privateAreaAcres * 100) / 100,
      totalTrees,
      remainingPlantationCapacity,
      totalLand: lands.length,
    };
  }
}
