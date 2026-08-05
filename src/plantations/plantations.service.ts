import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { LandsService } from '../lands/lands.service';
import {
  TreeAvailability,
  TreeMaster,
  TreeMasterDocument,
} from '../tree-masters/schemas/tree-master.schema';
import { CreatePlantationDto } from './dto/create-plantation.dto';
import { PlantationQueryDto } from './dto/plantation-query.dto';
import { ReviewPlantationDto } from './dto/review-plantation.dto';
import { UpdatePlantationDto } from './dto/update-plantation.dto';
import {
  Plantation,
  PlantationDocument,
  PlantationStatus,
} from './schemas/plantation.schema';

export interface TreeMasterDashboardRow {
  treeMasterId: string;
  name: string;
  scientificName?: string;
  totalTrees: number;
  estimatedOxygenKg: number;
  estimatedCo2Kg: number;
  availability?: string;
}

@Injectable()
export class PlantationsService {
  constructor(
    @InjectModel(Plantation.name)
    private readonly plantationModel: Model<PlantationDocument>,
    @InjectModel(TreeMaster.name)
    private readonly treeMasterModel: Model<TreeMasterDocument>,
    private readonly landsService: LandsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateId(): Promise<string> {
    const result = await this.connection.collection('counters').findOneAndUpdate(
      { _id: 'plantationId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `PL-${seq.toString().padStart(6, '0')}`;
  }

  private async resolveTreeMaster(id: string) {
    const master = await this.treeMasterModel
      .findOne({ _id: id, isDeleted: false, isActive: true })
      .exec();
    if (!master) {
      throw new NotFoundException(`Tree Master "${id}" not found or inactive`);
    }
    if (master.availability === TreeAvailability.OUT_OF_STOCK) {
      throw new BadRequestException(
        `"${master.name}" is currently out of stock / unavailable for plantation`,
      );
    }
    return master;
  }

  private assertActivePolicy(dto: {
    vehicleNumber?: string;
    insuranceStatus?: string;
  }) {
    if (!dto.vehicleNumber?.trim()) {
      throw new BadRequestException(
        'Select a vehicle for the planter. Tree plantation requires a linked vehicle.',
      );
    }
    const status = String(dto.insuranceStatus || '').toUpperCase();
    if (status !== 'ACTIVE') {
      throw new BadRequestException(
        'Selected vehicle does not have an Active policy. Only Active-policy vehicles can plant trees.',
      );
    }
  }

  async create(dto: CreatePlantationDto): Promise<Plantation> {
    const master = await this.resolveTreeMaster(dto.treeMasterId);
    const land = await this.landsService.findOne(dto.landId);
    this.assertActivePolicy(dto);

    const plantationId = await this.generateId();
    const created = new this.plantationModel({
      plantationId,
      treeMasterId: new Types.ObjectId(dto.treeMasterId),
      treeMasterName: master.name,
      scientificName: master.scientificName,
      oxygenRateKgPerYear: master.oxygenRateKgPerYear || 0,
      co2RateKgPerYear: master.co2RateKgPerYear || 0,
      landId: new Types.ObjectId(dto.landId),
      landName: land.landName,
      userId: dto.userId,
      userName: dto.userName,
      mobile: dto.mobile,
      personId: dto.personId ? new Types.ObjectId(dto.personId) : null,
      vehicleNumber: dto.vehicleNumber,
      policyNumber: dto.policyNumber,
      insuranceStatus: dto.insuranceStatus
        ? String(dto.insuranceStatus).toUpperCase()
        : undefined,
      plantationDate: new Date(dto.plantationDate),
      count: Math.floor(dto.count),
      images: dto.images || [],
      status: PlantationStatus.PENDING,
      latitude: dto.latitude ?? land.latitude,
      longitude: dto.longitude ?? land.longitude,
      state: land.state,
      district: land.district,
      city: land.villageOrCity || land.village,
      vidhanSabha: land.vidhanSabha,
      remarks: dto.remarks,
    });
    return created.save();
  }

  async findAll(query: PlantationQueryDto = {}): Promise<Plantation[]> {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.treeMasterId && Types.ObjectId.isValid(query.treeMasterId)) {
      filter.treeMasterId = new Types.ObjectId(query.treeMasterId);
    }
    if (query.landId && Types.ObjectId.isValid(query.landId)) {
      filter.landId = new Types.ObjectId(query.landId);
    }
    if (query.search) {
      filter.$or = [
        { plantationId: { $regex: query.search, $options: 'i' } },
        { treeMasterName: { $regex: query.search, $options: 'i' } },
        { landName: { $regex: query.search, $options: 'i' } },
        { userName: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
      ];
    }
    return this.plantationModel
      .find(filter as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Plantation> {
    const entry = await this.plantationModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!entry) throw new NotFoundException(`Plantation "${id}" not found`);
    return entry;
  }

  async update(id: string, dto: UpdatePlantationDto): Promise<Plantation> {
    const existing = await this.findOne(id);
    if (
      existing.status !== PlantationStatus.PENDING &&
      existing.status !== PlantationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only pending or rejected plantation requests can be edited',
      );
    }

    const patch: Record<string, unknown> = { ...dto };
    if (dto.treeMasterId) {
      const master = await this.resolveTreeMaster(dto.treeMasterId);
      patch.treeMasterId = new Types.ObjectId(dto.treeMasterId);
      patch.treeMasterName = master.name;
      patch.scientificName = master.scientificName;
      patch.oxygenRateKgPerYear = master.oxygenRateKgPerYear || 0;
      patch.co2RateKgPerYear = master.co2RateKgPerYear || 0;
    }
    if (dto.landId) {
      const land = await this.landsService.findOne(dto.landId);
      patch.landId = new Types.ObjectId(dto.landId);
      patch.landName = land.landName;
      patch.state = land.state;
      patch.district = land.district;
      patch.city = land.villageOrCity || land.village;
      patch.vidhanSabha = land.vidhanSabha;
      if (dto.latitude === undefined) patch.latitude = land.latitude;
      if (dto.longitude === undefined) patch.longitude = land.longitude;
    }
    if (dto.plantationDate) {
      patch.plantationDate = new Date(dto.plantationDate);
    }
    if (dto.count != null) patch.count = Math.floor(dto.count);
    if (dto.personId) patch.personId = new Types.ObjectId(dto.personId);
    if (dto.insuranceStatus) {
      patch.insuranceStatus = String(dto.insuranceStatus).toUpperCase();
    }
    this.assertActivePolicy({
      vehicleNumber:
        dto.vehicleNumber ?? existing.vehicleNumber ?? undefined,
      insuranceStatus:
        dto.insuranceStatus ?? existing.insuranceStatus ?? undefined,
    });

    // Re-submit after edit
    patch.status = PlantationStatus.PENDING;
    patch.rejectionReason = undefined;

    const updated = await this.plantationModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, patch, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Plantation "${id}" not found`);
    return updated;
  }

  async review(id: string, dto: ReviewPlantationDto): Promise<Plantation> {
    const existing = await this.findOne(id);
    if (existing.status !== PlantationStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be reviewed');
    }
    if (
      dto.status !== PlantationStatus.APPROVED &&
      dto.status !== PlantationStatus.REJECTED &&
      dto.status !== PlantationStatus.PLANTED
    ) {
      throw new BadRequestException('Invalid review status');
    }
    if (
      dto.status === PlantationStatus.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BadRequestException('Rejection reason is required');
    }

    const updated = await this.plantationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          status: dto.status,
          rejectionReason:
            dto.status === PlantationStatus.REJECTED
              ? dto.rejectionReason
              : undefined,
          reviewedBy: dto.reviewedBy || 'admin',
          reviewedAt: new Date(),
        },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(`Plantation "${id}" not found`);

    // Refresh land planted capacity when approved/planted
    if (
      dto.status === PlantationStatus.APPROVED ||
      dto.status === PlantationStatus.PLANTED
    ) {
      try {
        await this.landsService.syncPlantedTrees(String(existing.landId));
      } catch {
        // land sync best-effort
      }
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.plantationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) throw new NotFoundException(`Plantation "${id}" not found`);
  }

  /** Aggregate approved/planted counts by Tree Master for dashboard */
  async dashboardByTreeMaster(): Promise<TreeMasterDashboardRow[]> {
    const groups = await this.plantationModel.aggregate<{
      _id: Types.ObjectId;
      totalTrees: number;
      oxygenRate: number;
      co2Rate: number;
      name: string;
      scientificName?: string;
    }>([
      {
        $match: {
          isDeleted: false,
          status: {
            $in: [PlantationStatus.APPROVED, PlantationStatus.PLANTED],
          },
        },
      },
      {
        $group: {
          _id: '$treeMasterId',
          totalTrees: { $sum: '$count' },
          oxygenRate: { $avg: '$oxygenRateKgPerYear' },
          co2Rate: { $avg: '$co2RateKgPerYear' },
          name: { $first: '$treeMasterName' },
          scientificName: { $first: '$scientificName' },
        },
      },
      { $sort: { totalTrees: -1 } },
    ]);

    const masters = await this.treeMasterModel
      .find({ isDeleted: false })
      .select('_id name scientificName availability oxygenRateKgPerYear co2RateKgPerYear')
      .lean()
      .exec();

    const byId = new Map(groups.map((g) => [String(g._id), g]));

    return masters.map((m) => {
      const g = byId.get(String(m._id));
      const totalTrees = g?.totalTrees || 0;
      const o2 = m.oxygenRateKgPerYear || g?.oxygenRate || 0;
      const co2 = m.co2RateKgPerYear || g?.co2Rate || 0;
      return {
        treeMasterId: String(m._id),
        name: m.name,
        scientificName: m.scientificName,
        totalTrees,
        estimatedOxygenKg: Math.round(totalTrees * o2),
        estimatedCo2Kg: Math.round(totalTrees * co2),
        availability: m.availability,
      };
    });
  }
}
