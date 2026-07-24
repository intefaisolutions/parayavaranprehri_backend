import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Location, LocationDocument } from '../schemas/location.schema';

@Injectable()
export class LocationRepository extends BaseRepository<LocationDocument> {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
  ) {
    super(locationModel);
  }

  async existsByName(
    locationName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      locationName: { $regex: `^${locationName}$`, $options: 'i' },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.locationModel.findOne(filter).exec();
    return !!existing;
  }
}
