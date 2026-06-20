import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto, userId: string): Promise<Vehicle> {
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

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
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
