import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationRepository } from './repositories/location.repository';
import { Location, LocationDocument } from './schemas/location.schema';

@Injectable()
export class LocationsService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    const exists = await this.locationRepository.existsByName(
      dto.locationName,
    );
    if (exists) {
      throw new ConflictException(
        `A location named "${dto.locationName}" already exists`,
      );
    }
    return this.locationRepository.create(dto as Partial<LocationDocument>);
  }

  async findAll(query: LocationQueryDto): Promise<PaginatedResult<Location>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.locationType !== undefined) {
      baseFilter.locationType = query.locationType;
    }
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    return this.locationRepository.findPaginated(options, baseFilter, [
      'locationName',
      'parentLocation',
    ]);
  }

  async findOne(id: string): Promise<Location> {
    const entry = await this.locationRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Location "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    await this.findOne(id);

    if (dto.locationName !== undefined) {
      const exists = await this.locationRepository.existsByName(
        dto.locationName,
        id,
      );
      if (exists) {
        throw new ConflictException(
          `Another location already uses the name "${dto.locationName}"`,
        );
      }
    }

    const updated = await this.locationRepository.updateById(
      id,
      dto as Partial<LocationDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Location "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.locationRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Location "${id}" not found`);
    }
  }
}
