import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
export class JourneyService {
  constructor(
    @InjectModel(JourneyAchievement.name)
    private readonly achievementModel: Model<JourneyAchievementDocument>,
    @InjectModel(JourneyProfile.name)
    private readonly profileModel: Model<JourneyProfileDocument>,
  ) {}

  async getPublicTimeline() {
    const profile = await this.getOrCreateProfile();
    await this.ensureDefaultAchievements();
    const achievements = await this.achievementModel
      .find({ isDeleted: false, isActive: true })
      .sort({ year: 1, displayOrder: 1, createdAt: 1 })
      .exec();
    return { profile, achievements };
  }

  private async ensureDefaultAchievements() {
    const count = await this.achievementModel
      .countDocuments({ isDeleted: false })
      .exec();
    if (count > 0) return;

    const defaults = [
      {
        year: '2002',
        type: 'recognition',
        title: 'State Level Farmer Recognition',
        subtitle: 'Government of Madhya Pradesh',
        displayOrder: 1,
      },
      {
        year: '2003',
        type: 'recognition',
        title: 'District Level Environmental Award',
        subtitle: 'Government of Madhya Pradesh',
        displayOrder: 2,
      },
      {
        year: '2011',
        type: 'award',
        title: 'Sarvottam Krishak Puraskar',
        subtitle: 'Jaiv Praudyogiki Vibhag MP',
        displayOrder: 3,
      },
      {
        year: '2015',
        type: 'record',
        title: 'Golden Book of World Records',
        subtitle: 'Golden Book of World Records',
        displayOrder: 4,
      },
      {
        year: '2018',
        type: 'doctorate',
        title: 'Honorary Doctorate in Environmental Science',
        subtitle: 'Dr. Harisingh Gour University, Sagar',
        displayOrder: 5,
      },
      {
        year: '2018',
        type: 'international',
        title: 'Indo Global Education Excellence Award',
        subtitle: 'Indo Global Chamber of Commerce',
        displayOrder: 6,
      },
    ];
    await this.achievementModel.insertMany(defaults);
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
    return this.achievementModel.create(dto);
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
    const updated = await this.achievementModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
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
        name: 'Dr. Ram Patidar',
        subtitle: 'Journey & Achievements',
        stats: [
          { value: '1,00,000+', label: 'Trees Planted' },
          { value: '3', label: 'World Records' },
          { value: '30+', label: 'Awards Received' },
          { value: '25+', label: 'Years of Service' },
        ],
        tags: [
          'Environmentalist',
          'Biodiversity Expert',
          'Farmer Innovator',
          'Social Reformer',
          'World Record Holder',
        ],
        inspirationText:
          'Paryavaran Prahri is inspired by the lifelong dedication of Dr. Ram Patidar towards environmental conservation, biodiversity protection, and community participation. His work in plantation, farmer innovation, and social reform continues to guide the vision of Mission 2047 and Net Zero Bharat.',
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
