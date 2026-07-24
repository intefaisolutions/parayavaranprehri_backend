import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateVidhanSabhaDto } from './dto/create-vidhan-sabha.dto';
import { UpdateVidhanSabhaDto } from './dto/update-vidhan-sabha.dto';
import { VidhanSabhaQueryDto } from './dto/vidhan-sabha-query.dto';
import { VidhanSabhaRepository } from './repositories/vidhan-sabha.repository';
import {
  VidhanSabha,
  VidhanSabhaDocument,
} from './schemas/vidhan-sabha.schema';

@Injectable()
export class VidhanSabhasService {
  constructor(
    private readonly vidhanSabhaRepository: VidhanSabhaRepository,
  ) {}

  async create(dto: CreateVidhanSabhaDto): Promise<VidhanSabha> {
    const exists = await this.vidhanSabhaRepository.existsByName(
      dto.vidhanSabhaName,
    );
    if (exists) {
      throw new ConflictException(
        `A Vidhan Sabha named "${dto.vidhanSabhaName}" already exists`,
      );
    }
    return this.vidhanSabhaRepository.create(
      dto as unknown as Partial<VidhanSabhaDocument>,
    );
  }

  async findAll(
    query: VidhanSabhaQueryDto,
  ): Promise<PaginatedResult<VidhanSabha>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.district !== undefined) {
      baseFilter.district = query.district;
    }
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    return this.vidhanSabhaRepository.findPaginated(options, baseFilter, [
      'vidhanSabhaName',
      'district',
      'state',
      'assignedAdmin',
    ]);
  }

  async findOne(id: string): Promise<VidhanSabha> {
    const entry = await this.vidhanSabhaRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
    return entry;
  }

  async update(
    id: string,
    dto: UpdateVidhanSabhaDto,
  ): Promise<VidhanSabha> {
    if (dto.vidhanSabhaName !== undefined) {
      const exists = await this.vidhanSabhaRepository.existsByName(
        dto.vidhanSabhaName,
        id,
      );
      if (exists) {
        throw new ConflictException(
          `Another Vidhan Sabha already uses the name "${dto.vidhanSabhaName}"`,
        );
      }
    }

    const updated = await this.vidhanSabhaRepository.updateById(
      id,
      dto as unknown as Partial<VidhanSabhaDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.vidhanSabhaRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Vidhan Sabha "${id}" not found`);
    }
  }
}
