import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import {
  CallCenterContact,
  CallCenterContactDocument,
} from '../schemas/call-center.schema';

@Injectable()
export class CallCenterRepository extends BaseRepository<CallCenterContactDocument> {
  constructor(
    @InjectModel(CallCenterContact.name)
    private readonly callCenterModel: Model<CallCenterContactDocument>,
  ) {
    super(callCenterModel);
  }
}
