import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateLanguageDto } from './dto/create-language.dto';
import { LanguageQueryDto } from './dto/language-query.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguageRepository } from './repositories/language.repository';
import { Language, LanguageDocument, LanguageStatus } from './schemas/language.schema';

@Injectable()
export class LanguagesService {
  constructor(private readonly languageRepository: LanguageRepository) {}

  async create(dto: CreateLanguageDto): Promise<Language> {
    const exists = await this.languageRepository.existsByCode(
      dto.languageCode,
    );
    if (exists) {
      throw new ConflictException(
        `A language with code "${dto.languageCode}" already exists`,
      );
    }
    return this.languageRepository.create(
      dto as unknown as Partial<LanguageDocument>,
    );
  }

  async findAll(query: LanguageQueryDto): Promise<PaginatedResult<Language>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }

    return this.languageRepository.findPaginated(options, baseFilter, [
      'languageName',
      'languageCode',
    ]);
  }

  async findOne(id: string): Promise<Language> {
    const entry = await this.languageRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Language "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateLanguageDto): Promise<Language> {
    if (dto.languageCode !== undefined) {
      const exists = await this.languageRepository.existsByCode(
        dto.languageCode,
        id,
      );
      if (exists) {
        throw new ConflictException(
          `Another language already uses the code "${dto.languageCode}"`,
        );
      }
    }

    const updated = await this.languageRepository.updateById(
      id,
      dto as unknown as Partial<LanguageDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Language "${id}" not found`);
    }
    return updated;
  }

  async setStatus(id: string, status: LanguageStatus): Promise<Language> {
    const updated = await this.languageRepository.updateById(id, {
      status,
    } as Partial<LanguageDocument>);
    if (!updated) {
      throw new NotFoundException(`Language "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.languageRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Language "${id}" not found`);
    }
  }
}
