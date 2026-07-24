import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateMediaDto } from './dto/create-media.dto';
import { MediaQueryDto } from './dto/media-query.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaRepository } from './repositories/media.repository';
import { Media, MediaDocument } from './schemas/media.schema';

@Injectable()
export class MediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async create(dto: CreateMediaDto): Promise<Media> {
    return this.mediaRepository.create(dto as Partial<MediaDocument>);
  }

  async findAll(query: MediaQueryDto): Promise<PaginatedResult<Media>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.mediaType) {
      baseFilter.mediaType = query.mediaType;
    }
    if (query.usedInModule) {
      baseFilter.usedInModule = query.usedInModule;
    }
    if (query.status) {
      baseFilter.status = query.status;
    }

    return this.mediaRepository.findPaginated(options, baseFilter, [
      'name',
      'uploadedBy',
    ]);
  }

  async findOne(id: string): Promise<Media> {
    const entry = await this.mediaRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Media item "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateMediaDto): Promise<Media> {
    const updated = await this.mediaRepository.updateById(
      id,
      dto as Partial<MediaDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Media item "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.mediaRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Media item "${id}" not found`);
    }
  }
}
