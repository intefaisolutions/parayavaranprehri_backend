import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Person, PersonDocument } from '../schemas/person.schema';

@Injectable()
export class PersonRepository extends BaseRepository<PersonDocument> {
  constructor(
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
  ) {
    super(personModel);
  }

  async findByMobile(mobile: string): Promise<PersonDocument | null> {
    return this.personModel.findOne({ mobile, isDeleted: false }).exec();
  }

  async findByPersonId(personId: string): Promise<PersonDocument | null> {
    return this.personModel.findOne({ personId, isDeleted: false }).exec();
  }

  async existsByMobile(mobile: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = { mobile, isDeleted: false };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.personModel.findOne(filter).exec();
    return !!existing;
  }
}
