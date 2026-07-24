import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CallCenterQueryDto } from './dto/call-center-query.dto';
import { CreateCallCenterDto } from './dto/create-call-center.dto';
import { UpdateCallCenterDto } from './dto/update-call-center.dto';
import { CallCenterRepository } from './repositories/call-center.repository';
import {
  CallCenterContact,
  CallCenterContactDocument,
} from './schemas/call-center.schema';

@Injectable()
export class CallCenterService {
  constructor(private readonly callCenterRepository: CallCenterRepository) {}

  async create(dto: CreateCallCenterDto): Promise<CallCenterContact> {
    return this.callCenterRepository.create({
      ...dto,
      lastUpdated: new Date(),
    } as Partial<CallCenterContactDocument>);
  }

  async findAll(
    query: CallCenterQueryDto,
  ): Promise<PaginatedResult<CallCenterContact>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.status) {
      baseFilter.status = query.status;
    }
    if (query.contactType) {
      baseFilter.contactType = query.contactType;
    }

    return this.callCenterRepository.findPaginated(options, baseFilter, [
      'contactValue',
      'assignedPerson',
    ]);
  }

  async findOne(id: string): Promise<CallCenterContact> {
    const entry = await this.callCenterRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Call center contact "${id}" not found`);
    }
    return entry;
  }

  async update(
    id: string,
    dto: UpdateCallCenterDto,
  ): Promise<CallCenterContact> {
    const updated = await this.callCenterRepository.updateById(id, {
      ...dto,
      lastUpdated: new Date(),
    } as Partial<CallCenterContactDocument>);
    if (!updated) {
      throw new NotFoundException(`Call center contact "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.callCenterRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Call center contact "${id}" not found`);
    }
  }
}
