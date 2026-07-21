import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateGreenSelfieDto } from './dto/create-green-selfie.dto';
import { UpdateGreenSelfieDto } from './dto/update-green-selfie.dto';
import {
  GreenSelfie,
  GreenSelfieDocument,
} from './schemas/green-selfie.schema';

@Injectable()
export class GreenSelfiesService {
  constructor(
    @InjectModel(GreenSelfie.name)
    private greenSelfieModel: Model<GreenSelfieDocument>,
  ) {}

  async create(
    createGreenSelfieDto: CreateGreenSelfieDto,
    userId: string,
  ): Promise<GreenSelfie> {
    const createdGreenSelfie = new this.greenSelfieModel({
      ...createGreenSelfieDto,
      userId,
    });
    return createdGreenSelfie.save();
  }

  async findAll(userId?: string): Promise<GreenSelfie[]> {
    const filter = userId ? { userId } : {};
    return this.greenSelfieModel.find(filter).exec();
  }

  async findOne(id: string): Promise<GreenSelfie> {
    const greenSelfie = await this.greenSelfieModel.findById(id).exec();
    if (!greenSelfie) {
      throw new NotFoundException(`Green Selfie with ID ${id} not found`);
    }
    return greenSelfie;
  }

  async update(
    id: string,
    updateGreenSelfieDto: UpdateGreenSelfieDto,
  ): Promise<GreenSelfie> {
    const updatedGreenSelfie = await this.greenSelfieModel
      .findByIdAndUpdate(id, updateGreenSelfieDto, { new: true })
      .exec();
    if (!updatedGreenSelfie) {
      throw new NotFoundException(`Green Selfie with ID ${id} not found`);
    }
    return updatedGreenSelfie;
  }

  async remove(id: string): Promise<GreenSelfie> {
    const deletedGreenSelfie = await this.greenSelfieModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedGreenSelfie) {
      throw new NotFoundException(`Green Selfie with ID ${id} not found`);
    }
    return deletedGreenSelfie;
  }
}
