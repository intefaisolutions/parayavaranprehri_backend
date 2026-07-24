import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import {
  PersonIdentity,
  PersonIdentityDocument,
} from '../schemas/person-identity.schema';

@Injectable()
export class PersonIdentityRepository extends BaseRepository<PersonIdentityDocument> {
  constructor(
    @InjectModel(PersonIdentity.name)
    private readonly personIdentityModel: Model<PersonIdentityDocument>,
  ) {
    super(personIdentityModel);
  }

  async findByIdentityId(
    identityId: string,
  ): Promise<PersonIdentityDocument | null> {
    return this.personIdentityModel
      .findOne({ identityId, isDeleted: false })
      .exec();
  }

  async existsByPersonMobile(
    personMobile: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      personMobile,
      isDeleted: false,
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.personIdentityModel.findOne(filter).exec();
    return !!existing;
  }
}
