import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreatePersonIdentityDto } from './dto/create-person-identity.dto';
import { PersonIdentityQueryDto } from './dto/person-identity-query.dto';
import { UpdatePersonIdentityDto } from './dto/update-person-identity.dto';
import { PersonIdentityRepository } from './repositories/person-identity.repository';
import {
  PersonIdentity,
  PersonIdentityDocument,
  VehicleStickerStatus,
} from './schemas/person-identity.schema';

@Injectable()
export class PersonIdentityService {
  constructor(
    private readonly personIdentityRepository: PersonIdentityRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateIdentityId(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'personIdentityId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `PI-${seq.toString().padStart(6, '0')}`;
  }

  async create(dto: CreatePersonIdentityDto): Promise<PersonIdentity> {
    if (dto.personMobile) {
      const exists = await this.personIdentityRepository.existsByPersonMobile(
        dto.personMobile,
      );
      if (exists) {
        throw new ConflictException(
          `An identity record for mobile "${dto.personMobile}" already exists`,
        );
      }
    }

    const identityId = await this.generateIdentityId();
    const qrCode = dto.qrCode || `QR-${identityId}`;

    return this.personIdentityRepository.create({
      ...dto,
      identityId,
      qrCode,
    } as Partial<PersonIdentityDocument>);
  }

  async findAll(
    query: PersonIdentityQueryDto,
  ): Promise<PaginatedResult<PersonIdentity>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }
    if (query.vehicleStickerStatus !== undefined) {
      baseFilter.vehicleStickerStatus = query.vehicleStickerStatus;
    }

    return this.personIdentityRepository.findPaginated(options, baseFilter, [
      'personName',
      'personMobile',
      'identityId',
      'qrCode',
    ]);
  }

  async findOne(id: string): Promise<PersonIdentity> {
    const entry = await this.personIdentityRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Person identity "${id}" not found`);
    }
    return entry;
  }

  async update(
    id: string,
    dto: UpdatePersonIdentityDto,
  ): Promise<PersonIdentity> {
    await this.findOne(id);

    if (dto.personMobile !== undefined) {
      const exists = await this.personIdentityRepository.existsByPersonMobile(
        dto.personMobile,
        id,
      );
      if (exists) {
        throw new ConflictException(
          'Another identity record already uses this mobile number',
        );
      }
    }

    const updated = await this.personIdentityRepository.updateById(
      id,
      dto as Partial<PersonIdentityDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Person identity "${id}" not found`);
    }
    return updated;
  }

  async setVehicleStickerStatus(
    id: string,
    vehicleStickerStatus: VehicleStickerStatus,
  ): Promise<PersonIdentity> {
    const updated = await this.personIdentityRepository.updateById(id, {
      vehicleStickerStatus,
    } as Partial<PersonIdentityDocument>);
    if (!updated) {
      throw new NotFoundException(`Person identity "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.personIdentityRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Person identity "${id}" not found`);
    }
  }
}
