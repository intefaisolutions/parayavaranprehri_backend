import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import type {} from 'multer';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export type UploadCategory =
  | 'users'
  | 'certificates'
  | 'trees'
  | 'documents'
  | 'general';

@Injectable()
export class S3UploadService implements OnModuleInit {
  private readonly logger = new Logger(S3UploadService.name);
  private client: S3Client | null = null;
  private cachedBucket: string | undefined;
  private cachedRegion: string | undefined;
  private cachedAccessKeyId: string | undefined;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_REGION');
    const hasKeys = Boolean(
      this.configService.get<string>('AWS_ACCESS_KEY_ID') &&
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    );
    if (bucket && region && hasKeys) {
      this.logger.log(
        `S3 uploads ready → bucket="${bucket}" region="${region}"`,
      );
    } else {
      this.logger.warn(
        'S3 uploads not fully configured (need AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME).',
      );
    }
  }

  private getClient(): { client: S3Client; bucket: string; region: string } {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const region = this.configService.get<string>('AWS_REGION');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      throw new BadRequestException(
        'File uploads are not configured. Missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION / AWS_S3_BUCKET_NAME.',
      );
    }

    const needsRefresh =
      !this.client ||
      this.cachedRegion !== region ||
      this.cachedBucket !== bucket ||
      this.cachedAccessKeyId !== accessKeyId;

    if (needsRefresh) {
      // WHEN_REQUIRED avoids x-amz-checksum-mode on signed GET URLs,
      // which breaks browser <img> / fetch preview for private objects.
      this.client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
      this.cachedRegion = region;
      this.cachedBucket = bucket;
      this.cachedAccessKeyId = accessKeyId;
    }

    return { client: this.client!, bucket, region };
  }

  private sanitizeFileName(originalName: string): string {
    const lastDot = originalName.lastIndexOf('.');
    const name = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
    const ext = lastDot > 0 ? originalName.slice(lastDot + 1) : 'bin';

    const safeName =
      name
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'file';

    return `${safeName}.${ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'}`;
  }

  /**
   * Keys live under category folders in the dedicated project bucket, e.g.
   * "certificates/1721…-a1b2c3-logo.png".
   */
  private buildKey(category: UploadCategory, originalName: string): string {
    const uniquePrefix = `${Date.now()}-${randomBytes(3).toString('hex')}`;
    const safeName = this.sanitizeFileName(originalName);
    return `${category}/${uniquePrefix}-${safeName}`;
  }

  /** Parse bucket + object key from a full S3 URL (or treat input as a key). */
  extractBucketAndKey(urlOrKey: string): {
    bucket: string | null;
    key: string | null;
  } {
    if (!urlOrKey) return { bucket: null, key: null };

    if (!urlOrKey.startsWith('http')) {
      return { bucket: null, key: urlOrKey.replace(/^\/+/, '') };
    }

    try {
      const parsed = new URL(urlOrKey);
      const host = parsed.hostname;
      const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

      // Path-style: s3.region.amazonaws.com/bucket/key  OR  s3-region.amazonaws.com/bucket/key
      if (host.startsWith('s3.') || host.startsWith('s3-')) {
        const slash = path.indexOf('/');
        if (slash < 0) return { bucket: path || null, key: null };
        return {
          bucket: path.slice(0, slash),
          key: path.slice(slash + 1) || null,
        };
      }

      // Virtual-hosted: bucket.s3.region.amazonaws.com/key
      // Also: bucket.s3.amazonaws.com/key
      const virtualMatch = host.match(
        /^(.+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i,
      );
      if (virtualMatch) {
        return { bucket: virtualMatch[1], key: path || null };
      }

      const legacyMatch = host.match(/^(.+)\.s3\.amazonaws\.com$/i);
      if (legacyMatch) {
        return { bucket: legacyMatch[1], key: path || null };
      }

      return { bucket: null, key: path || null };
    } catch {
      return { bucket: null, key: null };
    }
  }

  /** @deprecated Use extractBucketAndKey — kept for callers that only need the key. */
  extractKeyFromUrl(urlOrKey: string): string | null {
    return this.extractBucketAndKey(urlOrKey).key;
  }

  /** Temporary signed GET URL so private S3 objects can be shown in <img> tags. */
  async getSignedGetUrl(
    urlOrKey: string,
    expiresInSeconds = 60 * 60,
  ): Promise<string> {
    const { bucket: urlBucket, key } = this.extractBucketAndKey(urlOrKey);
    if (!key) {
      throw new BadRequestException('Invalid file URL or key');
    }

    const { client, bucket: defaultBucket } = this.getClient();
    const bucket = urlBucket || defaultBucket;

    return getSignedUrl(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    category: UploadCategory = 'general',
  ): Promise<{
    key: string;
    bucket: string;
    /** Permanent object URL — store this in the database. */
    url: string;
    /** Temporary signed GET URL — use for <img src> / immediate preview. */
    signedUrl: string;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: images (jpg, png, webp, gif, svg) and PDF.`,
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File is too large (max 100MB).');
    }

    const { client, bucket, region } = this.getClient();
    const key = this.buildKey(category, file.originalname);

    const baseParams = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Prefer public-read so stored URLs work in <img> tags. Some buckets have
    // ACLs disabled ("Bucket owner enforced") — fall back to a private object
    // and rely on signed preview URLs for display.
    try {
      await client.send(
        new PutObjectCommand({ ...baseParams, ACL: 'public-read' }),
      );
    } catch (err: any) {
      const msg = String(err?.name || err?.Code || err?.message || '');
      if (
        msg.includes('AccessControlListNotSupported') ||
        msg.includes('InvalidRequest') ||
        msg.includes('AccessDenied')
      ) {
        this.logger.warn(
          `ACL public-read not allowed on bucket "${bucket}"; uploading private object (${msg})`,
        );
        await client.send(new PutObjectCommand(baseParams));
      } else {
        throw err;
      }
    }

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    // Long-lived enough for form editing / certificate preview sessions.
    const signedUrl = await this.getSignedGetUrl(url, 60 * 60 * 12);
    this.logger.log(`Uploaded file to s3://${bucket}/${key}`);

    return { key, bucket, url, signedUrl };
  }
}
