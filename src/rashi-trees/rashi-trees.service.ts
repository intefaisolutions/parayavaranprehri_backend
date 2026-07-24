import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateRashiTreeDto } from './dto/create-rashi-tree.dto';
import { RashiTreeQueryDto } from './dto/rashi-tree-query.dto';
import { UpdateRashiTreeDto } from './dto/update-rashi-tree.dto';
import { RashiTreeRepository } from './repositories/rashi-tree.repository';
import { RashiTree, RashiTreeDocument } from './schemas/rashi-tree.schema';
import { getZodiacFromDate } from './utils/zodiac.util';

export interface PublicRashiTreeResponse {
  rashi: string;
  rashiHindi: string;
  zodiacNumber: number;
  tree: string;
  scientificName?: string;
  localName?: string;
  description?: string;
  benefits: string[];
  careInstructions?: string;
  image?: string;
  galleryImages: string[];
}

@Injectable()
export class RashiTreesService {
  constructor(private readonly rashiTreeRepository: RashiTreeRepository) {}

  private toPublicResponse(entry: RashiTree): PublicRashiTreeResponse {
    return {
      rashi: entry.rashiName,
      rashiHindi: entry.rashiNameHindi,
      zodiacNumber: entry.zodiacNumber,
      tree: entry.recommendedTree,
      scientificName: entry.scientificName,
      localName: entry.localName,
      description: entry.description,
      benefits: entry.benefits ?? [],
      careInstructions: entry.careInstructions,
      image: entry.image,
      galleryImages: entry.galleryImages ?? [],
    };
  }

  async create(dto: CreateRashiTreeDto): Promise<RashiTree> {
    const exists = await this.rashiTreeRepository.existsByRashiOrNumber(
      dto.rashiName,
      dto.zodiacNumber,
    );
    if (exists) {
      throw new ConflictException(
        `A Rashi tree entry for "${dto.rashiName}" or zodiac number ${dto.zodiacNumber} already exists`,
      );
    }
    return this.rashiTreeRepository.create(dto as Partial<RashiTreeDocument>);
  }

  async findAll(
    query: RashiTreeQueryDto,
  ): Promise<PaginatedResult<RashiTree>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.isActive !== undefined) {
      baseFilter.isActive = query.isActive;
    }

    return this.rashiTreeRepository.findPaginated(options, baseFilter, [
      'rashiName',
      'rashiNameHindi',
      'recommendedTree',
      'scientificName',
      'localName',
    ]);
  }

  async findOne(id: string): Promise<RashiTree> {
    const entry = await this.rashiTreeRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Rashi tree entry "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateRashiTreeDto): Promise<RashiTree> {
    const current = await this.findOne(id);

    if (dto.rashiName !== undefined || dto.zodiacNumber !== undefined) {
      const exists = await this.rashiTreeRepository.existsByRashiOrNumber(
        dto.rashiName ?? current.rashiName,
        dto.zodiacNumber ?? current.zodiacNumber,
        id,
      );
      if (exists) {
        throw new ConflictException(
          'Another Rashi tree entry already uses this rashi name or zodiac number',
        );
      }
    }

    const updated = await this.rashiTreeRepository.updateById(
      id,
      dto as Partial<RashiTreeDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Rashi tree entry "${id}" not found`);
    }
    return updated;
  }

  async setActive(id: string, isActive: boolean): Promise<RashiTree> {
    const updated = await this.rashiTreeRepository.updateById(id, {
      isActive,
    } as Partial<RashiTreeDocument>);
    if (!updated) {
      throw new NotFoundException(`Rashi tree entry "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.rashiTreeRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Rashi tree entry "${id}" not found`);
    }
  }

  async findByRashiPublic(rashiName: string): Promise<PublicRashiTreeResponse> {
    const entry = await this.rashiTreeRepository.findByRashiName(rashiName);
    if (!entry) {
      throw new NotFoundException(
        `No tree recommendation found for rashi "${rashiName}"`,
      );
    }
    return this.toPublicResponse(entry);
  }

  async findByDobPublic(dob: string): Promise<PublicRashiTreeResponse> {
    if (!dob) {
      throw new BadRequestException('dob query parameter is required (YYYY-MM-DD)');
    }

    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date of birth');
    }

    const zodiac = getZodiacFromDate(date);
    const entry = await this.rashiTreeRepository.findByZodiacNumber(
      zodiac.zodiacNumber,
    );
    if (!entry) {
      throw new NotFoundException(
        `No tree recommendation configured yet for ${zodiac.rashiName} (zodiac #${zodiac.zodiacNumber})`,
      );
    }
    return this.toPublicResponse(entry);
  }
}
