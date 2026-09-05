import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UpdateConceptVideoDto,
  YOUTUBE_URL_REGEX,
} from './dto/update-concept-video.dto';
import {
  ConceptVideo,
  ConceptVideoDocument,
} from './schemas/concept-video.schema';

@Injectable()
export class ConceptVideoService {
  constructor(
    @InjectModel(ConceptVideo.name)
    private conceptVideoModel: Model<ConceptVideoDocument>,
  ) { }

  extractYoutubeId(url?: string): string {
    if (!url) return '';
    const match = url.trim().match(YOUTUBE_URL_REGEX);
    return match && match[1] ? match[1] : '';
  }

  async get(): Promise<ConceptVideo> {
    let video = await this.conceptVideoModel.findOne({ isActive: true }).exec();
    if (!video) {
      // Create default initial document
      video = await this.conceptVideoModel.create({
        title: 'What is Paryavaran Prahri?',
        subtitle:
          'Learn how vehicles, citizens, plantation and environmental contribution come together under Mission 2047.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        thumbnailUrl:
          'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        isActive: true,
      });
    }
    return video.toObject ? video.toObject() : video;
  }

  async update(dto: UpdateConceptVideoDto): Promise<ConceptVideo> {
    let youtubeId = dto.youtubeId || '';

    if (dto.videoUrl) {
      const extracted = this.extractYoutubeId(dto.videoUrl);
      if (extracted) {
        youtubeId = extracted;
      }
    }

    let thumbnailUrl = dto.thumbnailUrl?.trim();
    if (!thumbnailUrl && youtubeId) {
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }

    const payload: Partial<ConceptVideo> = { ...dto };
    payload.youtubeId = youtubeId;
    if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;

    let video = await this.conceptVideoModel.findOne().exec();
    if (video) {
      const updated = await this.conceptVideoModel
        .findByIdAndUpdate(video._id, payload, { new: true })
        .exec();
      return updated
        ? updated.toObject
          ? updated.toObject()
          : updated
        : video.toObject();
    } else {
      const created = await this.conceptVideoModel.create({
        title: dto.title || 'What is Paryavaran Prahri?',
        subtitle:
          dto.subtitle ||
          'Learn how vehicles, citizens, plantation and environmental contribution come together under Mission 2047.',
        videoUrl:
          dto.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: youtubeId || 'dQw4w9WgXcQ',
        thumbnailUrl:
          thumbnailUrl ||
          'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      });
      return created.toObject ? created.toObject() : created;
    }
  }
}
