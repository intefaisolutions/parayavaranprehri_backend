import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  resequenceDisplayOrdersIfDuplicated,
  resolveUniqueDisplayOrder,
} from '../common/utils/display-order.util';
import { CreateJourneyAchievementDto } from './dto/create-journey-achievement.dto';
import { UpdateJourneyAchievementDto } from './dto/update-journey-achievement.dto';
import { UpdateJourneyProfileDto } from './dto/update-journey-profile.dto';
import {
  JourneyAchievement,
  JourneyAchievementDocument,
} from './schemas/journey-achievement.schema';
import {
  JourneyProfile,
  JourneyProfileDocument,
} from './schemas/journey-profile.schema';

@Injectable()
export class JourneyService implements OnModuleInit {
  private readonly logger = new Logger(JourneyService.name);

  constructor(
    @InjectModel(JourneyAchievement.name)
    private readonly achievementModel: Model<JourneyAchievementDocument>,
    @InjectModel(JourneyProfile.name)
    private readonly profileModel: Model<JourneyProfileDocument>,
  ) {}

  async onModuleInit() {
    const changed = await resequenceDisplayOrdersIfDuplicated(
      this.achievementModel as Model<any>,
    );
    if (changed > 0) {
      this.logger.log(
        `Normalized journey achievement displayOrder for ${changed} rows`,
      );
    }
  }

  /** Public feed — no auto-seed of Dr. Ram / default achievements. */
  async getPublicTimeline() {
    const profile = await this.profileModel
      .findOne({ isDeleted: false })
      .sort({ createdAt: 1 })
      .exec();
    const achievements = await this.achievementModel
      .find({ isDeleted: false, isActive: true })
      .sort({ year: 1, displayOrder: 1, createdAt: 1 })
      .exec();
    return { profile, achievements };
  }

  async listAchievements(includeInactive = false) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (!includeInactive) filter.isActive = true;
    return this.achievementModel
      .find(filter)
      .sort({ year: 1, displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async createAchievement(dto: CreateJourneyAchievementDto) {
    const displayOrder = await resolveUniqueDisplayOrder(
      this.achievementModel as Model<any>,
      dto.displayOrder,
      { label: 'Display order' },
    );
    return this.achievementModel.create({ ...dto, displayOrder });
  }

  async findAchievement(id: string) {
    const item = await this.achievementModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!item) {
      throw new NotFoundException(`Journey achievement "${id}" not found`);
    }
    return item;
  }

  async updateAchievement(id: string, dto: UpdateJourneyAchievementDto) {
    const payload: UpdateJourneyAchievementDto = { ...dto };
    if (dto.displayOrder !== undefined) {
      payload.displayOrder = await resolveUniqueDisplayOrder(
        this.achievementModel as Model<any>,
        dto.displayOrder,
        { excludeId: id, label: 'Display order' },
      );
    }
    const updated = await this.achievementModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, payload, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Journey achievement "${id}" not found`);
    }
    return updated;
  }

  async removeAchievement(id: string) {
    const removed = await this.achievementModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!removed) {
      throw new NotFoundException(`Journey achievement "${id}" not found`);
    }
  }

  async getOrCreateProfile() {
    let profile = await this.profileModel
      .findOne({ isDeleted: false })
      .sort({ createdAt: 1 })
      .exec();
    if (!profile) {
      profile = await this.profileModel.create({
        name: '',
        subtitle: 'Journey & Achievements',
        stats: [],
        tags: [],
        inspirationText: '',
      });
    }
    return profile;
  }

  async updateProfile(dto: UpdateJourneyProfileDto) {
    const profile = await this.getOrCreateProfile();
    Object.assign(profile, dto);
    return profile.save();
  }
}
