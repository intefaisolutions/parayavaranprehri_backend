import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { MitrasService } from '../mitras/mitras.service';
import { UsersService } from '../modules/users/users.service';
import { CreateMitraEventDto } from './dto/create-mitra-event.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateMitraEventDto } from './dto/update-mitra-event.dto';
import {
  AttendanceStatus,
  MitraEventAttendance,
  MitraEventAttendanceDocument,
} from './schemas/mitra-event-attendance.schema';
import { MitraEvent, MitraEventDocument } from './schemas/mitra-event.schema';

@Injectable()
export class MitraEventsService {
  constructor(
    @InjectModel(MitraEvent.name)
    private readonly eventModel: Model<MitraEventDocument>,
    @InjectModel(MitraEventAttendance.name)
    private readonly attendanceModel: Model<MitraEventAttendanceDocument>,
    private readonly mitrasService: MitrasService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMitraEventDto) {
    return this.eventModel.create({
      ...dto,
      date: new Date(dto.date),
    });
  }

  async findAll(activeOnly = true) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (activeOnly) filter.isActive = true;
    return this.eventModel.find(filter).sort({ date: 1 }).exec();
  }

  async findOne(id: string) {
    const event = await this.eventModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!event) {
      throw new NotFoundException(`Mitra event "${id}" not found`);
    }
    return event;
  }

  async update(id: string, dto: UpdateMitraEventDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.date) update.date = new Date(dto.date);
    const updated = await this.eventModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Mitra event "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string) {
    const removed = await this.eventModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) {
      throw new NotFoundException(`Mitra event "${id}" not found`);
    }
  }

  private async resolveMitraForUser(user: JwtPayload, mitraIdHint?: string) {
    if (
      mitraIdHint &&
      (user.role === SystemRole.SUPER_ADMIN || user.role === SystemRole.ADMIN)
    ) {
      const mitra = await this.mitrasService.findByMitraId(mitraIdHint);
      return mitra;
    }

    const me = (await this.usersService.findOne(user.sub)) as {
      phone?: string;
      firstName?: string;
      lastName?: string;
    };
    if (!me.phone) {
      throw new BadRequestException(
        'Your profile has no phone number linked to a Mitra',
      );
    }
    const mitra = await this.mitrasService.findByMobile(me.phone);
    if (!mitra) {
      throw new BadRequestException(
        'No Mitra profile found for your phone number',
      );
    }
    return mitra;
  }

  async markAttendance(
    eventId: string,
    user: JwtPayload,
    dto: MarkAttendanceDto,
  ) {
    await this.findOne(eventId);
    const mitra = await this.resolveMitraForUser(user, dto.mitraId);

    try {
      const attendance = await this.attendanceModel.findOneAndUpdate(
        {
          eventId: new Types.ObjectId(eventId),
          mitraId: mitra.mitraId,
          isDeleted: false,
        },
        {
          eventId: new Types.ObjectId(eventId),
          mitraId: mitra.mitraId,
          userId: user.sub,
          mitraName: mitra.name,
          status: dto.status ?? AttendanceStatus.PRESENT,
          notes: dto.notes,
          attendedAt: new Date(),
          isDeleted: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return attendance;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('Attendance already marked for this event');
      }
      throw error;
    }
  }

  async listAttendance(eventId: string) {
    await this.findOne(eventId);
    return this.attendanceModel
      .find({ eventId, isDeleted: false })
      .sort({ attendedAt: -1 })
      .exec();
  }

  async listMyEventsWithAttendance(user: JwtPayload) {
    const events = await this.findAll(true);
    let mitraId: string | null = null;
    try {
      const mitra = await this.resolveMitraForUser(user);
      mitraId = mitra.mitraId;
    } catch {
      mitraId = null;
    }

    if (!mitraId) {
      return events.map((event) => ({
        ...event.toObject(),
        attendanceMarked: false,
      }));
    }

    const attendance = await this.attendanceModel
      .find({
        mitraId,
        isDeleted: false,
        eventId: { $in: events.map((e) => e._id) },
      })
      .exec();
    const attendedIds = new Set(attendance.map((a) => String(a.eventId)));

    return events.map((event) => ({
      ...event.toObject(),
      attendanceMarked: attendedIds.has(String(event._id)),
    }));
  }
}
