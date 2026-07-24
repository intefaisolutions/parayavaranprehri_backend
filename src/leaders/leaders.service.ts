import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { LeaderQueryDto } from './dto/leader-query.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { LeaderRepository } from './repositories/leader.repository';
import { Leader, LeaderDocument } from './schemas/leader.schema';

@Injectable()
export class LeadersService {
  constructor(private readonly leaderRepository: LeaderRepository) {}

  async create(dto: CreateLeaderDto): Promise<Leader> {
    return this.leaderRepository.create(dto as Partial<LeaderDocument>);
  }

  async findAll(query: LeaderQueryDto): Promise<PaginatedResult<Leader>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.isActive !== undefined) {
      baseFilter.isActive = query.isActive;
    }

    return this.leaderRepository.findPaginated(options, baseFilter, [
      'leaderName',
      'designation',
      'organization',
    ]);
  }

  async findOne(id: string): Promise<Leader> {
    const leader = await this.leaderRepository.findById(id);
    if (!leader) {
      throw new NotFoundException(`Leader "${id}" not found`);
    }
    return leader;
  }

  async update(id: string, dto: UpdateLeaderDto): Promise<Leader> {
    const updated = await this.leaderRepository.updateById(
      id,
      dto as Partial<LeaderDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`Leader "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.leaderRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Leader "${id}" not found`);
    }
  }
}
