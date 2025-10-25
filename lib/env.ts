import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const ENV_FILES = ['.env.local', '.env'];

for (const fileName of ENV_FILES) {
  const envPath = resolve(process.cwd(), fileName);
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  POSTGRES_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  CLOUDFLARE_R2_ENDPOINT: z.string().url().optional(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET: z.string().optional(),
  CLOUDFLARE_R2_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_MAX_UPLOAD_SIZE: z.string().regex(/^\d+$/).optional(),
  UPLOAD_MAX_FILE_SIZE: z.string().regex(/^\d+$/).optional(),
  UPLOAD_DIR: z.string().optional(),
  UPLOAD_SECRET_KEY: z.string().min(32).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ADMIN_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

const REQUIRED_IN_PRODUCTION: Array<keyof Env> = [
  'POSTGRES_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_ACCESS_KEY_ID',
  'CLOUDFLARE_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET',
  'UPLOAD_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ADMIN_API_KEY',
];

function ensureEnv(rawEnv: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${formattedErrors}`);
  }

  const env = parsed.data;
  const missingRequired = REQUIRED_IN_PRODUCTION.filter((key) => {
    const value = env[key];
    return value === undefined || value === null || value === '';
  });

  if (missingRequired.length > 0) {
    const message = `Missing required environment variables: ${missingRequired.join(', ')}`;
    if (env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(message);
  }

  const baseUrlCandidate = env.NEXT_PUBLIC_BASE_URL ?? env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const normalizedBaseUrl = baseUrlCandidate.replace(/\/+$/, '');
  const normalizedSiteUrl = (env.NEXT_PUBLIC_SITE_URL ?? normalizedBaseUrl).replace(/\/+$/, '');

  return {
    ...env,
    NEXT_PUBLIC_BASE_URL: normalizedBaseUrl,
    NEXT_PUBLIC_SITE_URL: normalizedSiteUrl,
  };
}

export const env = ensureEnv(process.env);
export type AppEnv = typeof env;
export default env;
