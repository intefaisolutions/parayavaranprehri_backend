import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingQueryDto } from './dto/setting-query.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingRepository } from './repositories/setting.repository';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(private readonly settingRepository: SettingRepository) {}

  private resolveActor(user?: JwtPayload): string | undefined {
    return user?.email ?? undefined;
  }

  async create(dto: CreateSettingDto, user?: JwtPayload): Promise<Setting> {
    const exists = await this.settingRepository.existsBySettingName(
      dto.settingName,
    );
    if (exists) {
      throw new ConflictException(
        `A setting named "${dto.settingName}" already exists`,
      );
    }

    return this.settingRepository.create({
      ...dto,
      updatedBy: this.resolveActor(user),
      lastUpdatedDate: new Date(),
    } as Partial<SettingDocument>);
  }

  async findAll(query: SettingQueryDto): Promise<PaginatedResult<Setting>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.category !== undefined) {
      baseFilter.category = query.category;
    }
    if (query.isActive !== undefined) {
      baseFilter.isActive = query.isActive;
    }

    return this.settingRepository.findPaginated(options, baseFilter, [
      'settingName',
      'category',
      'value',
    ]);
  }

  async findOne(id: string): Promise<Setting> {
    const setting = await this.settingRepository.findById(id);
    if (!setting) {
      throw new NotFoundException(`Setting "${id}" not found`);
    }
    return setting;
  }

  async findBySettingName(settingName: string): Promise<Setting> {
    const setting = await this.settingRepository.findBySettingName(settingName);
    if (!setting) {
      throw new NotFoundException(`Setting "${settingName}" not found`);
    }
    return setting;
  }

  async update(
    id: string,
    dto: UpdateSettingDto,
    user?: JwtPayload,
  ): Promise<Setting> {
    await this.findOne(id);

    if (dto.settingName !== undefined) {
      const exists = await this.settingRepository.existsBySettingName(
        dto.settingName,
        id,
      );
      if (exists) {
        throw new ConflictException(
          `Another setting already uses the name "${dto.settingName}"`,
        );
      }
    }

    const updated = await this.settingRepository.updateById(id, {
      ...dto,
      updatedBy: this.resolveActor(user),
      lastUpdatedDate: new Date(),
    } as Partial<SettingDocument>);
    if (!updated) {
      throw new NotFoundException(`Setting "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.settingRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Setting "${id}" not found`);
    }
  }
}
