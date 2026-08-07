import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { UsersService } from '../modules/users/users.service';
import { CreateRashiPlantRequestDto } from './dto/create-rashi-plant-request.dto';
import { ReviewRashiPlantRequestDto } from './dto/review-rashi-plant-request.dto';
import {
  RashiPlantRequest,
  RashiPlantRequestDocument,
  RashiPlantRequestStatus,
} from './schemas/rashi-plant-request.schema';

@Injectable()
export class RashiPlantRequestsService {
  constructor(
    @InjectModel(RashiPlantRequest.name)
    private readonly requestModel: Model<RashiPlantRequestDocument>,
    private readonly usersService: UsersService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async generateId(): Promise<string> {
    const result = await this.connection.collection('counters').findOneAndUpdate(
      { _id: 'rashiPlantRequestId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    const seq = result?.seq || 1;
    return `RPR-${seq.toString().padStart(6, '0')}`;
  }

  async create(dto: CreateRashiPlantRequestDto, user: JwtPayload) {
    const me = (await this.usersService.findOne(user.sub)) as {
      phone?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      district?: string;
      state?: string;
    };

    const userName = [me.firstName, me.lastName].filter(Boolean).join(' ').trim();
    const requestId = await this.generateId();

    return this.requestModel.create({
      requestId,
      userId: user.sub,
      userName: userName || undefined,
      mobile: me.phone,
      email: me.email || user.email,
      district: me.district,
      state: me.state,
      rashiName: dto.rashiName.trim(),
      rashiNameHindi: dto.rashiNameHindi?.trim(),
      recommendedTree: dto.recommendedTree.trim(),
      scientificName: dto.scientificName?.trim(),
      localName: dto.localName?.trim(),
      treeDescription: dto.treeDescription?.trim(),
      benefits: dto.benefits || [],
      remarks: dto.remarks?.trim(),
      status: RashiPlantRequestStatus.PENDING,
    });
  }

  async findAll(
    user: JwtPayload,
    query: { status?: string; mine?: string } = {},
  ) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.status) filter.status = query.status;

    const isAdmin =
      user.role === SystemRole.SUPER_ADMIN || user.role === SystemRole.ADMIN;
    if (!isAdmin || query.mine === 'true') {
      filter.userId = user.sub;
    }

    return this.requestModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.requestModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!doc) {
      throw new NotFoundException(`Sacred tree plant request "${id}" not found`);
    }
    return doc;
  }

  async review(
    id: string,
    dto: ReviewRashiPlantRequestDto,
    reviewer: JwtPayload,
  ) {
    if (dto.status === RashiPlantRequestStatus.PENDING) {
      throw new BadRequestException('Cannot set status back to PENDING');
    }
    if (
      dto.status === RashiPlantRequestStatus.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BadRequestException('Rejection reason is required');
    }

    const updated = await this.requestModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          status: dto.status,
          rejectionReason: dto.rejectionReason?.trim(),
          remarks: dto.remarks?.trim(),
          reviewedBy: reviewer.sub,
          reviewedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Sacred tree plant request "${id}" not found`);
    }
    return updated;
  }
}
