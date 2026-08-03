import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { MitrasService } from '../mitras/mitras.service';
import { UsersService } from '../modules/users/users.service';
import { CreateFieldIssueDto } from './dto/create-field-issue.dto';
import { UpdateFieldIssueStatusDto } from './dto/update-field-issue-status.dto';
import {
  FieldIssue,
  FieldIssueDocument,
  FieldIssueStatus,
} from './schemas/field-issue.schema';

@Injectable()
export class FieldIssuesService {
  constructor(
    @InjectModel(FieldIssue.name)
    private readonly issueModel: Model<FieldIssueDocument>,
    private readonly usersService: UsersService,
    private readonly mitrasService: MitrasService,
  ) {}

  async create(dto: CreateFieldIssueDto, user: JwtPayload) {
    const me = (await this.usersService.findOne(user.sub)) as {
      phone?: string;
      firstName?: string;
      lastName?: string;
    };
    let mitraId = dto.mitraId;
    if (!mitraId && me.phone) {
      const mitra = await this.mitrasService.findByMobile(me.phone);
      mitraId = mitra?.mitraId;
    }

    return this.issueModel.create({
      ...dto,
      mitraId,
      reportedByUserId: user.sub,
      reportedByName: [me.firstName, me.lastName].filter(Boolean).join(' '),
      status: FieldIssueStatus.OPEN,
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
      filter.reportedByUserId = user.sub;
    }

    return this.issueModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const issue = await this.issueModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!issue) {
      throw new NotFoundException(`Field issue "${id}" not found`);
    }
    return issue;
  }

  async updateStatus(id: string, dto: UpdateFieldIssueStatusDto) {
    const update: Record<string, unknown> = {
      status: dto.status,
      resolutionNotes: dto.resolutionNotes,
    };
    if (
      dto.status === FieldIssueStatus.RESOLVED ||
      dto.status === FieldIssueStatus.CLOSED
    ) {
      update.resolvedAt = new Date();
    }

    const updated = await this.issueModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Field issue "${id}" not found`);
    }
    return updated;
  }
}
