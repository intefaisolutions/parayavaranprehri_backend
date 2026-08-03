import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { GlobalIdentityService } from '../common/services/global-identity.service';
import {
  normalizeEmail,
  normalizeMobile,
} from '../common/utils/identity.util';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PartnerQueryDto } from './dto/partner-query.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnerRepository } from './repositories/partner.repository';
import { Partner, PartnerDocument } from './schemas/partner.schema';

@Injectable()
export class PartnersService {
  constructor(
    private readonly partnerRepository: PartnerRepository,
    private readonly globalIdentity: GlobalIdentityService,
  ) {}

  async create(dto: CreatePartnerDto): Promise<Partner> {
    const phone = normalizeMobile(dto.phone) ?? dto.phone.trim();
    const email = normalizeEmail(dto.email);

    await this.globalIdentity.assertAvailable({
      as: 'partner',
      mobile: phone,
      email,
    });

    return this.partnerRepository.create({
      ...dto,
      phone,
      email,
    } as Partial<PartnerDocument>);
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
    const existing = await this.findOne(id);

    const nextPhone =
      dto.phone !== undefined
        ? normalizeMobile(dto.phone) ?? dto.phone.trim()
        : normalizeMobile(existing.phone) ?? existing.phone;
    const nextEmail =
      dto.email !== undefined
        ? normalizeEmail(dto.email)
        : normalizeEmail(existing.email);

    const patch: Partial<PartnerDocument> = {
      ...dto,
    } as Partial<PartnerDocument>;

    if (dto.phone !== undefined) {
      patch.phone = nextPhone;
    }
    if (dto.email !== undefined) {
      patch.email = nextEmail;
    }

    if (dto.phone !== undefined || dto.email !== undefined) {
      await this.globalIdentity.assertAvailable({
        as: 'partner',
        mobile: nextPhone,
        email: nextEmail,
        exclude: { partnerId: id },
      });
    }

    const updated = await this.partnerRepository.updateById(id, patch);
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
