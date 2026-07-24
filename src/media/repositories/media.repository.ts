import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Media, MediaDocument } from '../schemas/media.schema';

@Injectable()
export class MediaRepository extends BaseRepository<MediaDocument> {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<MediaDocument>,
  ) {
    super(mediaModel);
  }
}
