import { Injectable, Logger } from '@nestjs/common';
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
import { S3UploadService } from '../../common/services/s3-upload.service';

/**
 * How long (in seconds) the GET signed URL for concept video playback is valid.
 * 1 hour is sufficient for a single viewing session.
 * Mobile app re-fetches on next Dashboard load, so short-lived URLs are safe.
 */
const PLAYBACK_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

/** Returns true if the URL points to an S3 object (permanent, unsigned). */
function isS3Url(url?: string): boolean {
  if (!url) return false;
  return /amazonaws\.com|\.s3[.-]/i.test(url);
}

@Injectable()
export class ConceptVideoService {
  private readonly logger = new Logger(ConceptVideoService.name);

  constructor(
    @InjectModel(ConceptVideo.name)
    private conceptVideoModel: Model<ConceptVideoDocument>,
    // S3UploadService is provided globally via CommonModule (@Global).
    // No extra module import is needed.
    private readonly s3UploadService: S3UploadService,
  ) { }

  extractYoutubeId(url?: string): string {
    if (!url) return '';
    const match = url.trim().match(YOUTUBE_URL_REGEX);
    return match && match[1] ? match[1] : '';
  }

  /**
   * Returns the active Concept Video document.
   *
   * If `videoUrl` is a private S3 object URL, a short-lived GET signed URL
   * is generated and returned as `playbackUrl`.  The original permanent URL
   * (`videoUrl`) is preserved in the response so the client can re-sign later
   * if needed.
   *
   * For YouTube URLs the signed URL step is skipped and `playbackUrl` equals
   * `videoUrl` unchanged (YouTube needs no signing).
   */
  async get(): Promise<ConceptVideo & { playbackUrl?: string }> {
    let video = await this.conceptVideoModel.findOne({ isActive: true }).exec();
    if (!video) {
      // Create initial document without sample video
      video = await this.conceptVideoModel.create({
        title: 'What is Paryavaran Prahri?',
        subtitle:
          'Learn how vehicles, citizens, plantation and environmental contribution come together under Mission 2047.',
        videoUrl: '',
        youtubeId: '',
        thumbnailUrl: '',
        isActive: true,
      });
    }

    const doc: ConceptVideo & { playbackUrl?: string } = video.toObject
      ? video.toObject()
      : (video as unknown as ConceptVideo & { playbackUrl?: string });

    // S3 objects in this bucket are publicly readable.
    // Directly use videoUrl as playbackUrl — no signing needed.
    // (Signed URLs were returning 403 because the bucket uses public-read ACL,
    //  not private — signing is only needed for private buckets.)
    doc.playbackUrl = doc.videoUrl || '';

    return doc;
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
        videoUrl: dto.videoUrl || '',
        youtubeId: youtubeId || '',
        thumbnailUrl: thumbnailUrl || '',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      });
      return created.toObject ? created.toObject() : created;
    }
  }
}
