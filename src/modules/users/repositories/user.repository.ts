import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<UserDocument | null> {
    const filter = { email, isDeleted: false };

    if (includePassword) {
      return this.userModel.findOne(filter).select('+password').exec();
    }

    return this.userModel.findOne(filter).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.findByEmail(email, true);
  }

  async findByPhone(
    phone: string,
    includePassword = false,
  ): Promise<UserDocument | null> {
    const filter = { phone, isDeleted: false };
    if (includePassword) {
      return this.userModel.findOne(filter).select('+password').exec();
    }
    return this.userModel.findOne(filter).exec();
  }
}
