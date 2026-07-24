import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateMapDto } from './dto/create-map.dto';
import { MapQueryDto } from './dto/map-query.dto';
import { UpdateMapDto } from './dto/update-map.dto';
import { MapRepository } from './repositories/map.repository';
import { MapRecord, MapRecordDocument } from './schemas/map.schema';

@Injectable()
export class MapsService {
  constructor(private readonly mapRepository: MapRepository) {}

  async create(dto: CreateMapDto): Promise<MapRecord> {
    return this.mapRepository.create(dto as Partial<MapRecordDocument>);
  }

  async findAll(query: MapQueryDto): Promise<PaginatedResult<MapRecord>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    return this.mapRepository.findPaginated(options, baseFilter, [
      'locationName',
      'plantationArea',
      'addedBy',
    ]);
  }

  async findOne(id: string): Promise<MapRecord> {
    const entry = await this.mapRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Map record "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateMapDto): Promise<MapRecord> {
    await this.findOne(id);
    const updated = await this.mapRepository.updateById(
      id,
      dto as Partial<MapRecordDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Map record "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.mapRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Map record "${id}" not found`);
    }
  }
}
