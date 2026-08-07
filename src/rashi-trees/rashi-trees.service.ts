import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { resolveUniqueDisplayOrder } from '../common/utils/display-order.util';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateRashiTreeDto } from './dto/create-rashi-tree.dto';
import { RashiTreeQueryDto } from './dto/rashi-tree-query.dto';
import { UpdateRashiTreeDto } from './dto/update-rashi-tree.dto';
import { RashiTreeRepository } from './repositories/rashi-tree.repository';
import { RashiTree, RashiTreeDocument } from './schemas/rashi-tree.schema';
import { getZodiacFromDate } from './utils/zodiac.util';

export interface PublicRashiTreeItem {
  tree: string;
  scientificName?: string;
  localName?: string;
  description?: string;
  benefits: string[];
  careInstructions?: string;
  image?: string;
  galleryImages: string[];
  displayOrder?: number;
}

/** Public lookup — supports multiple trees per Rashi. */
export interface PublicRashiTreeResponse {
  rashi: string;
  rashiHindi: string;
  zodiacNumber: number;
  /** All recommended trees for this Rashi (sorted by displayOrder). */
  trees: PublicRashiTreeItem[];
  /** Legacy single-tree fields (first / primary recommendation). */
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
  constructor(
    private readonly rashiTreeRepository: RashiTreeRepository,
    @InjectModel(RashiTree.name)
    private readonly rashiTreeModel: Model<RashiTreeDocument>,
  ) {}

  private toTreeItem(entry: RashiTree): PublicRashiTreeItem {
    return {
      tree: entry.recommendedTree,
      scientificName: entry.scientificName,
      localName: entry.localName,
      description: entry.description,
      benefits: entry.benefits ?? [],
      careInstructions: entry.careInstructions,
      image: entry.image,
      galleryImages: entry.galleryImages ?? [],
      displayOrder: entry.displayOrder,
    };
  }

  private toPublicResponse(entries: RashiTree[]): PublicRashiTreeResponse {
    const primary = entries[0];
    const trees = entries.map((e) => this.toTreeItem(e));
    return {
      rashi: primary.rashiName,
      rashiHindi: primary.rashiNameHindi,
      zodiacNumber: primary.zodiacNumber,
      trees,
      tree: primary.recommendedTree,
      scientificName: primary.scientificName,
      localName: primary.localName,
      description: primary.description,
      benefits: primary.benefits ?? [],
      careInstructions: primary.careInstructions,
      image: primary.image,
      galleryImages: primary.galleryImages ?? [],
    };
  }

  async create(dto: CreateRashiTreeDto): Promise<RashiTree> {
    const duplicate = await this.rashiTreeRepository.existsByRashiAndTree(
      dto.rashiName,
      dto.zodiacNumber,
      dto.recommendedTree,
    );
    if (duplicate) {
      throw new ConflictException(
        `"${dto.recommendedTree}" is already recommended for ${dto.rashiName}. Choose a different tree.`,
      );
    }
    const displayOrder = await resolveUniqueDisplayOrder(
      this.rashiTreeModel as Model<any>,
      dto.displayOrder,
      {
        baseFilter: { zodiacNumber: dto.zodiacNumber },
        label: 'Display order',
      },
    );
    return this.rashiTreeRepository.create({
      ...dto,
      displayOrder,
    } as Partial<RashiTreeDocument>);
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
    const rashiName = dto.rashiName ?? current.rashiName;
    const zodiacNumber = dto.zodiacNumber ?? current.zodiacNumber;
    const recommendedTree = dto.recommendedTree ?? current.recommendedTree;

    const duplicate = await this.rashiTreeRepository.existsByRashiAndTree(
      rashiName,
      zodiacNumber,
      recommendedTree,
      id,
    );
    if (duplicate) {
      throw new ConflictException(
        `"${recommendedTree}" is already recommended for ${rashiName}. Choose a different tree.`,
      );
    }

    const payload: Partial<RashiTreeDocument> = {
      ...(dto as Partial<RashiTreeDocument>),
    };
    if (dto.displayOrder !== undefined) {
      payload.displayOrder = await resolveUniqueDisplayOrder(
        this.rashiTreeModel as Model<any>,
        dto.displayOrder,
        {
          excludeId: id,
          baseFilter: { zodiacNumber },
          label: 'Display order',
        },
      );
    }

    const updated = await this.rashiTreeRepository.updateById(id, payload);
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
    const entries =
      await this.rashiTreeRepository.findAllByRashiName(rashiName);
    if (!entries.length) {
      throw new NotFoundException(
        `No tree recommendation found for rashi "${rashiName}"`,
      );
    }
    return this.toPublicResponse(entries);
  }

  async findByDobPublic(dob: string): Promise<PublicRashiTreeResponse> {
    if (!dob) {
      throw new BadRequestException(
        'dob query parameter is required (YYYY-MM-DD)',
      );
    }

    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date of birth');
    }

    const zodiac = getZodiacFromDate(date);
    const entries = await this.rashiTreeRepository.findAllByZodiacNumber(
      zodiac.zodiacNumber,
    );
    if (!entries.length) {
      throw new NotFoundException(
        `No tree recommendation configured yet for ${zodiac.rashiName} (zodiac #${zodiac.zodiacNumber})`,
      );
    }
    return this.toPublicResponse(entries);
  }
}
