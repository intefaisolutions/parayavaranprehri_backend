import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().default(10),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  CORS_ORIGINS: z.string().default('*'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  HSP_SMS_USERNAME: z.string().optional(),
  HSP_SMS_PASSWORD: z.string().optional(),
  HSP_API_KEY: z.string().optional(),
  HSP_SMS_SENDER_ID: z.string().optional(),
  HSP_WHATSAPP_API_KEY: z.string().optional(),
  HSP_WHATSAPP_NUMBER: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  STATIC_OTP_MODE: z.string().optional(),
  STATIC_OTP_CODE: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
}).passthrough();
// .passthrough() ensures any env var not explicitly listed above (e.g. AWS_*,
// GEMINI_API_KEY, future additions) still reaches ConfigService.get() instead
// of being silently stripped, since this validated object replaces process.env
// for ConfigService lookups.

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}
