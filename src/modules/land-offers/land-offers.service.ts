import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLandOfferDto } from './dto/create-land-offer.dto';
import { UpdateLandOfferDto } from './dto/update-land-offer.dto';
import { LandOffer, LandOfferDocument } from './schemas/land-offer.schema';

@Injectable()
export class LandOffersService {
  constructor(
    @InjectModel(LandOffer.name)
    private landOfferModel: Model<LandOfferDocument>,
  ) {}

  async create(
    createLandOfferDto: CreateLandOfferDto,
    userId?: string,
  ): Promise<LandOffer> {
    const createdLandOffer = new this.landOfferModel({
      ...createLandOfferDto,
      userId,
    });
    return createdLandOffer.save();
  }

  async findAll(userId?: string): Promise<LandOffer[]> {
    const filter = userId ? { userId } : {};
    return this.landOfferModel.find(filter).exec();
  }

  async findOne(id: string): Promise<LandOffer> {
    const landOffer = await this.landOfferModel.findById(id).exec();
    if (!landOffer) {
      throw new NotFoundException(`Land Offer with ID ${id} not found`);
    }
    return landOffer;
  }

  async update(
    id: string,
    updateLandOfferDto: UpdateLandOfferDto,
  ): Promise<LandOffer> {
    const updatedLandOffer = await this.landOfferModel
      .findByIdAndUpdate(id, updateLandOfferDto, { new: true })
      .exec();
    if (!updatedLandOffer) {
      throw new NotFoundException(`Land Offer with ID ${id} not found`);
    }
    return updatedLandOffer;
  }

  async remove(id: string): Promise<LandOffer> {
    const deletedLandOffer = await this.landOfferModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedLandOffer) {
      throw new NotFoundException(`Land Offer with ID ${id} not found`);
    }
    return deletedLandOffer;
  }
}
