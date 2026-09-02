import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VehicleTreeRule, VehicleTreeRuleDocument } from './schemas/vehicle-tree-rule.schema';
import { CreateVehicleTreeRuleDto } from './dto/create-vehicle-tree-rule.dto';
import { UpdateVehicleTreeRuleDto } from './dto/update-vehicle-tree-rule.dto';

@Injectable()
export class VehicleTreeRulesService {
  constructor(
    @InjectModel(VehicleTreeRule.name)
    private readonly ruleModel: Model<VehicleTreeRuleDocument>,
  ) {}

  async create(dto: CreateVehicleTreeRuleDto): Promise<VehicleTreeRule> {
    const existing = await this.ruleModel.findOne({ vehicleType: dto.vehicleType });
    if (existing) {
      throw new ConflictException(`Rule for vehicle type '${dto.vehicleType}' already exists.`);
    }
    const created = new this.ruleModel(dto);
    return created.save();
  }

  async findAll(): Promise<VehicleTreeRule[]> {
    return this.ruleModel.find().sort({ vehicleType: 1 }).exec();
  }

  async findOne(id: string): Promise<VehicleTreeRule> {
    const rule = await this.ruleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException(`Vehicle tree rule #${id} not found`);
    }
    return rule;
  }

  async update(id: string, dto: UpdateVehicleTreeRuleDto): Promise<VehicleTreeRule> {
    if (dto.vehicleType) {
      const existing = await this.ruleModel.findOne({
        vehicleType: dto.vehicleType,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException(`Rule for vehicle type '${dto.vehicleType}' already exists.`);
      }
    }
    const updated = await this.ruleModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Vehicle tree rule #${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<VehicleTreeRule> {
    const deleted = await this.ruleModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Vehicle tree rule #${id} not found`);
    }
    return deleted;
  }
}
