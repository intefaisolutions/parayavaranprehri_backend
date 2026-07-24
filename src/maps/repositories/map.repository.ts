import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { MapRecord, MapRecordDocument } from '../schemas/map.schema';

@Injectable()
export class MapRepository extends BaseRepository<MapRecordDocument> {
  constructor(
    @InjectModel(MapRecord.name)
    private readonly mapModel: Model<MapRecordDocument>,
  ) {
    super(mapModel);
  }
}
