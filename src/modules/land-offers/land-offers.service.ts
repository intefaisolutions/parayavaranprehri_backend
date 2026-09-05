import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateLandOfferDto } from './dto/create-land-offer.dto';
import { UpdateLandOfferDto } from './dto/update-land-offer.dto';
import { LandOffer, LandOfferDocument } from './schemas/land-offer.schema';
import { UsersService } from '../users/users.service';
import { normalizeMobile } from '../../common/utils/identity.util';

@Injectable()
export class LandOffersService {
  constructor(
    @InjectModel(LandOffer.name)
    private landOfferModel: Model<LandOfferDocument>,
    private usersService: UsersService,
  ) {}

  async create(
    createLandOfferDto: CreateLandOfferDto,
    userId?: string,
  ): Promise<LandOffer> {
    const createdLandOffer = new this.landOfferModel({
      ...createLandOfferDto,
      userId: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      status: 'Pending',
    });
    return createdLandOffer.save();
  }

  async findMine(userId?: string, mobileParam?: string): Promise<LandOffer[]> {
    const conditions: Record<string, any>[] = [];

    if (userId && Types.ObjectId.isValid(userId)) {
      conditions.push({ userId: new Types.ObjectId(userId) });
      try {
        const userDoc = (await this.usersService.findOne(userId)) as any;
        const normPhone = normalizeMobile(userDoc?.phone || userDoc?.mobile);
        if (normPhone) {
          conditions.push({ mobile: new RegExp(normPhone, 'i') });
        }
      } catch {
        // Ignore user lookup error
      }
    }

    const normParam = normalizeMobile(mobileParam);
    if (normParam) {
      conditions.push({ mobile: new RegExp(normParam, 'i') });
    }

    if (conditions.length === 0) {
      return [];
    }

    return this.landOfferModel
      .find({ $or: conditions })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<LandOffer[]> {
    return this.landOfferModel
      .find()
      .populate('userId', 'firstName lastName email phone mobile')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<LandOffer> {
    const landOffer = await this.landOfferModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone mobile')
      .exec();
    if (!landOffer) {
      throw new NotFoundException(`Land Offer with ID ${id} not found`);
    }
    return landOffer;
  }

  async update(
    id: string,
    updateLandOfferDto: UpdateLandOfferDto,
  ): Promise<LandOffer> {
    if (updateLandOfferDto.status) {
      const lower = String(updateLandOfferDto.status).trim().toLowerCase();
      if (lower === 'selected') updateLandOfferDto.status = 'Selected';
      else if (lower === 'rejected') updateLandOfferDto.status = 'Rejected';
      else if (lower === 'pending') updateLandOfferDto.status = 'Pending';
    }
    const updatedLandOffer = await this.landOfferModel
      .findByIdAndUpdate(id, updateLandOfferDto, { new: true })
      .populate('userId', 'firstName lastName email phone mobile')
      .exec();
    if (!updatedLandOffer) {
      throw new NotFoundException(`Land Offer with ID ${id} not found`);
    }
    return updatedLandOffer;
  }

  async updateStatus(id: string, status: string): Promise<LandOffer> {
    let normalizedStatus = 'Pending';
    if (status) {
      const lower = String(status).trim().toLowerCase();
      if (lower === 'selected') normalizedStatus = 'Selected';
      else if (lower === 'rejected') normalizedStatus = 'Rejected';
      else if (lower === 'pending') normalizedStatus = 'Pending';
    }
    return this.update(id, { status: normalizedStatus });
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
