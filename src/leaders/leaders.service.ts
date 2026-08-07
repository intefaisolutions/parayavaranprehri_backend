import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import {
  resequenceDisplayOrdersIfDuplicated,
  resolveUniqueDisplayOrder,
} from '../common/utils/display-order.util';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { LeaderQueryDto } from './dto/leader-query.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { LeaderRepository } from './repositories/leader.repository';
import { Leader, LeaderDocument } from './schemas/leader.schema';

const NON_SEED_FILTER = {
  leaderName: { $not: { $regex: /^__seed_/ } },
};

@Injectable()
export class LeadersService implements OnModuleInit {
  private readonly logger = new Logger(LeadersService.name);

  constructor(
    private readonly leaderRepository: LeaderRepository,
    @InjectModel(Leader.name)
    private readonly leaderModel: Model<LeaderDocument>,
  ) {}

  async onModuleInit() {
    const changed = await resequenceDisplayOrdersIfDuplicated(
      this.leaderModel as Model<any>,
      NON_SEED_FILTER,
    );
    if (changed > 0) {
      this.logger.log(
        `Normalized leader displayOrder for ${changed} duplicate/gap rows`,
      );
    }
  }

  async create(dto: CreateLeaderDto): Promise<Leader> {
    const displayOrder = await resolveUniqueDisplayOrder(
      this.leaderModel as Model<any>,
      dto.displayOrder,
      { baseFilter: NON_SEED_FILTER, label: 'Display order' },
    );
    return this.leaderRepository.create({
      ...dto,
      displayOrder,
    } as Partial<LeaderDocument>);
  }

  async findAll(query: LeaderQueryDto): Promise<PaginatedResult<Leader>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {
      ...NON_SEED_FILTER,
    };
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
    const payload: Partial<LeaderDocument> = {
      ...(dto as Partial<LeaderDocument>),
    };
    if (dto.displayOrder !== undefined) {
      payload.displayOrder = await resolveUniqueDisplayOrder(
        this.leaderModel as Model<any>,
        dto.displayOrder,
        {
          excludeId: id,
          baseFilter: NON_SEED_FILTER,
          label: 'Display order',
        },
      );
    }

    const updated = await this.leaderRepository.updateById(id, payload);
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
