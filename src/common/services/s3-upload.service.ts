import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// All Paryavaran Prahri uploads live under this prefix inside the shared
// suregrowth-uploads bucket, alongside the old project's own folder, e.g.:
//   suregrowth-uploads/
//   ├── old-project/
//   └── paryavaran/
//       ├── users/
//       ├── certificates/
//       ├── trees/
//       └── documents/
const PROJECT_PREFIX = 'paryavaran';

export type UploadCategory =
  | 'users'
  | 'certificates'
  | 'trees'
  | 'documents'
  | 'general';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private client: S3Client | null = null;
  private bucket: string | undefined;
  private region: string | undefined;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): { client: S3Client; bucket: string } {
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

    if (!this.client || this.region !== region) {
      this.client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.region = region;
      this.bucket = bucket;
    }

    return { client: this.client, bucket };
  }

  private sanitizeFileName(originalName: string): string {
    const lastDot = originalName.lastIndexOf('.');
    const name = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
    const ext = lastDot > 0 ? originalName.slice(lastDot + 1) : 'bin';

    const safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'file';

    return `${safeName}.${ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'}`;
  }

  /**
   * Builds a namespaced key so this project's files never collide with the
   * old project's files in the shared bucket, e.g.
   * "paryavaran/certificates/1721… -a1b2c3-cert-logo.png".
   */
  private buildKey(category: UploadCategory, originalName: string): string {
    const uniquePrefix = `${Date.now()}-${randomBytes(3).toString('hex')}`;
    const safeName = this.sanitizeFileName(originalName);
    return `${PROJECT_PREFIX}/${category}/${uniquePrefix}-${safeName}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    category: UploadCategory = 'general',
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: images (jpg, png, webp, gif, svg) and PDF.`,
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File is too large (max 10MB).');
    }

    const { client, bucket } = this.getClient();
    const key = this.buildKey(category, file.originalname);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
    this.logger.log(`Uploaded file to S3: ${key}`);

    return { url, key };
  }
}
