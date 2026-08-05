import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { MitrasService } from '../mitras/mitras.service';
import { UsersService } from '../modules/users/users.service';
import { TreesService } from '../trees/trees.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import {
  MaintenanceLog,
  MaintenanceLogDocument,
} from './schemas/maintenance-log.schema';

@Injectable()
export class MaintenanceLogsService {
  constructor(
    @InjectModel(MaintenanceLog.name)
    private readonly logModel: Model<MaintenanceLogDocument>,
    private readonly usersService: UsersService,
    private readonly mitrasService: MitrasService,
    private readonly treesService: TreesService,
  ) {}

  async create(dto: CreateMaintenanceLogDto, user: JwtPayload) {
    const tree = await this.treesService.findByTreeId(dto.treeCode);
    if (!tree) {
      throw new BadRequestException(
        `Tree code "${dto.treeCode}" was not found. Select a tree from Tree Management.`,
      );
    }

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

    return this.logModel.create({
      ...dto,
      treeCode: tree.treeId,
      mitraId,
      createdByUserId: user.sub,
      createdByName: [me.firstName, me.lastName].filter(Boolean).join(' '),
      loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
    });
  }

  async findAll(
    user: JwtPayload,
    query: { treeCode?: string; mine?: string } = {},
  ) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.treeCode) filter.treeCode = query.treeCode;

    const isAdmin =
      user.role === SystemRole.SUPER_ADMIN || user.role === SystemRole.ADMIN;
    if (!isAdmin || query.mine === 'true') {
      filter.createdByUserId = user.sub;
    }

    return this.logModel.find(filter).sort({ loggedAt: -1 }).exec();
  }

  async findOne(id: string) {
    const log = await this.logModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!log) {
      throw new NotFoundException(`Maintenance log "${id}" not found`);
    }
    return log;
  }
}
