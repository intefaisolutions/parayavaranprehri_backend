import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { SystemRole } from '../../common/enums/role.enum';
import { oxygenToCo2Kg } from '../../common/utils/carbon.util';
import { Tree, TreeDocument } from '../../trees/schemas/tree.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';

function normalizePlate(plate: string): string {
  return String(plate || '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    @InjectModel(Tree.name) private treeModel: Model<TreeDocument>,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
  ): Promise<Vehicle> {
    const createdVehicle = new this.vehicleModel({
      ...createVehicleDto,
      userId,
    });
    return createdVehicle.save();
  }

  async findAll(userId?: string): Promise<Vehicle[]> {
    const filter = userId ? { userId } : {};
    return this.vehicleModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async findTreesForVehicle(id: string, user: JwtPayload) {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const ownerId = String(vehicle.userId);
    const isStaff =
      user.role === SystemRole.SUPER_ADMIN || user.role === SystemRole.ADMIN;
    if (!isStaff && ownerId !== user.sub) {
      throw new ForbiddenException(
        'You can only view trees for your own vehicles',
      );
    }

    const plateNorm = normalizePlate(vehicle.plate);
    const rawPlate = String(vehicle.plate || '').trim();
    const candidates = await this.treeModel
      .find({
        vehicleNumber: { $exists: true, $nin: [null, ''] },
      })
      .sort({ plantedDate: -1 })
      .lean()
      .exec();

    const list = candidates.filter((t) => {
      const vn = normalizePlate(String(t.vehicleNumber || ''));
      if (plateNorm && vn === plateNorm) return true;
      if (
        rawPlate &&
        String(t.vehicleNumber || '').toLowerCase() === rawPlate.toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    return {
      vehicleId: String(vehicle._id),
      plate: vehicle.plate,
      trees: list.map((t) => ({
        _id: t._id,
        treeId: t.treeId,
        treeName: t.treeName,
        species: t.species,
        status: t.status,
        plantedDate: t.plantedDate,
        height: t.height,
        oxygenKg: t.annualOxygenProductionKg ?? 0,
        co2Kg: oxygenToCo2Kg(t.annualOxygenProductionKg ?? 0),
        image: t.image || null,
        vidhanSabha: t.vidhanSabha || null,
      })),
      totalTrees: list.length,
    };
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const updatedVehicle = await this.vehicleModel
      .findByIdAndUpdate(id, updateVehicleDto, { new: true })
      .exec();
    if (!updatedVehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return updatedVehicle;
  }

  async remove(id: string): Promise<Vehicle> {
    const deletedVehicle = await this.vehicleModel.findByIdAndDelete(id).exec();
    if (!deletedVehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return deletedVehicle;
  }
}
