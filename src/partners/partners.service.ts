import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PartnerQueryDto } from './dto/partner-query.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnerRepository } from './repositories/partner.repository';
import { Partner, PartnerDocument } from './schemas/partner.schema';

@Injectable()
export class PartnersService {
  constructor(private readonly partnerRepository: PartnerRepository) {}

  async create(dto: CreatePartnerDto): Promise<Partner> {
    const exists = await this.partnerRepository.existsByPhone(dto.phone);
    if (exists) {
      throw new ConflictException(
        `A partner with phone "${dto.phone}" already exists`,
      );
    }
    return this.partnerRepository.create(dto as Partial<PartnerDocument>);
  }

  async findAll(query: PartnerQueryDto): Promise<PaginatedResult<Partner>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }
    if (query.partnerType !== undefined) {
      baseFilter.partnerType = query.partnerType;
    }

    return this.partnerRepository.findPaginated(options, baseFilter, [
      'partnerName',
      'contactPerson',
      'phone',
      'location',
    ]);
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.partnerRepository.findById(id);
    if (!partner) {
      throw new NotFoundException(`Partner "${id}" not found`);
    }
    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    if (dto.phone !== undefined) {
      const exists = await this.partnerRepository.existsByPhone(
        dto.phone,
        id,
      );
      if (exists) {
        throw new ConflictException(
          'Another partner already uses this phone number',
        );
      }
    }

    const updated = await this.partnerRepository.updateById(
      id,
      dto as Partial<PartnerDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Partner "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.partnerRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Partner "${id}" not found`);
    }
  }
}
