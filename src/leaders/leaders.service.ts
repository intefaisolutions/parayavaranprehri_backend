import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { S3UploadService } from '../common/services/s3-upload.service';
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

/** Strip query (incl. expired X-Amz signatures) → permanent object URL. */
function permanentS3Url(url?: string): string {
  if (!url) return '';
  if (/amazonaws\.com|\.s3[.-]/i.test(url) || /[?&]X-Amz-/i.test(url)) {
    return url.split('?')[0];
  }
  return url;
}

function isS3MediaUrl(url?: string): boolean {
  if (!url) return false;
  return /amazonaws\.com|\.s3[.-]/i.test(url) || /[?&]X-Amz-/i.test(url);
}

@Injectable()
export class LeadersService implements OnModuleInit {
  private readonly logger = new Logger(LeadersService.name);

  constructor(
    private readonly leaderRepository: LeaderRepository,
    private readonly s3UploadService: S3UploadService,
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

  /**
   * DB should store the permanent S3 object URL.
   * Responses always re-sign S3 URLs (even if an expired X-Amz URL was
   * previously stored) so the mobile app can load private bucket images.
   */
  private async withDisplayPhoto(leader: Leader): Promise<Leader> {
    const plain =
      typeof (leader as LeaderDocument).toObject === 'function'
        ? (leader as LeaderDocument).toObject()
        : { ...(leader as object) };
    const photo = String((plain as Leader).photo || '');
    if (!isS3MediaUrl(photo)) {
      return plain as Leader;
    }
    const permanent = permanentS3Url(photo);
    try {
      const signedUrl = await this.s3UploadService.getSignedGetUrl(
        permanent,
        60 * 60 * 6,
      );
      return { ...(plain as Leader), photo: signedUrl };
    } catch (error) {
      this.logger.warn(
        `Could not sign leader photo: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return { ...(plain as Leader), photo: permanent };
    }
  }

  async create(dto: CreateLeaderDto): Promise<Leader> {
    const displayOrder = await resolveUniqueDisplayOrder(
      this.leaderModel as Model<any>,
      dto.displayOrder,
      { baseFilter: NON_SEED_FILTER, label: 'Display order' },
    );
    const created = await this.leaderRepository.create({
      ...dto,
      photo: dto.photo ? permanentS3Url(dto.photo) : dto.photo,
      displayOrder,
    } as Partial<LeaderDocument>);
    return this.withDisplayPhoto(created);
  }

  async findAll(query: LeaderQueryDto): Promise<PaginatedResult<Leader>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {
      ...NON_SEED_FILTER,
    };
    if (query.isActive !== undefined) {
      baseFilter.isActive = query.isActive;
    }

    const page = await this.leaderRepository.findPaginated(
      options,
      baseFilter,
      ['leaderName', 'designation', 'organization'],
    );
    const items = await Promise.all(
      page.items.map((item) => this.withDisplayPhoto(item)),
    );
    return { ...page, items };
  }

  async findOne(id: string): Promise<Leader> {
    const leader = await this.leaderRepository.findById(id);
    if (!leader) {
      throw new NotFoundException(`Leader "${id}" not found`);
    }
    return this.withDisplayPhoto(leader);
  }

  async update(id: string, dto: UpdateLeaderDto): Promise<Leader> {
    const payload: Partial<LeaderDocument> = {
      ...(dto as Partial<LeaderDocument>),
    };
    if (dto.photo !== undefined) {
      payload.photo = dto.photo ? permanentS3Url(dto.photo) : dto.photo;
    }
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
    return this.withDisplayPhoto(updated);
  }

  async remove(id: string): Promise<void> {
    const removed = await this.leaderRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Leader "${id}" not found`);
    }
  }
}
