import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Leader, LeaderDocument } from '../schemas/leader.schema';

@Injectable()
export class LeaderRepository extends BaseRepository<LeaderDocument> {
  constructor(
    @InjectModel(Leader.name)
    private readonly leaderModel: Model<LeaderDocument>,
  ) {
    super(leaderModel);
  }
}
