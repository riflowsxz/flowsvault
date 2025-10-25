import path from 'node:path';
import os from 'node:os';

import { env } from './env';
import { UPLOAD_DURATIONS } from './upload-durations';

const DEFAULT_MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
const VERCEL_MAX_UPLOAD_SIZE = 4.5 * 1024 * 1024;

const isVercel = (): boolean => {
  return process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
};

const resolveUploadDir = (): string => {
  const configuredDir = env.UPLOAD_DIR?.trim();
  if (configuredDir) {
    return path.isAbsolute(configuredDir)
      ? configuredDir
      : path.resolve(process.cwd(), configuredDir);
  }

  if (isVercel()) {
    const baseTmpDir = process.env.TMPDIR || os.tmpdir();
    return path.join(baseTmpDir, 'uploads');
  }

  return path.join(process.cwd(), 'uploads');
};

const parseMaxUploadSize = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_MAX_UPLOAD_SIZE;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_UPLOAD_SIZE;
  }

  return parsed;
};

const getMaxUploadSize = (): number => {
  const configuredSize = parseMaxUploadSize(env.UPLOAD_MAX_FILE_SIZE ?? env.NEXT_PUBLIC_MAX_UPLOAD_SIZE);
  
  if (isVercel()) {
    console.warn('⚠️  Running on vercel: upload size limited to 4.5MB due to serverless constraints');
    return Math.min(configuredSize, VERCEL_MAX_UPLOAD_SIZE);
  }
  
  return configuredSize;
};

const uploadMaxFileSize = getMaxUploadSize();

export const APP_CONFIG = {
  upload: {
    maxFileSize: uploadMaxFileSize,
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.odt', '.ods', '.odp',
      '.txt', '.csv', '.json', '.xml', '.md',
      '.zip', '.rar', '.7z', '.tar', '.gz',
      '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flv', '.wmv', '.mkv',
      '.js', '.ts', '.html', '.css', '.php', '.py', '.java', '.cpp'
    ],
    uploadDir: resolveUploadDir(),
    durations: UPLOAD_DURATIONS,
    isVercel: isVercel(),
    vercelLimit: VERCEL_MAX_UPLOAD_SIZE,
  },
  security: {
    secretKey: env.UPLOAD_SECRET_KEY ?? env.NEXTAUTH_SECRET ?? '',
    rateLimiting: {
      windowMs: 5 * 60 * 1000,
      maxRequests: 100,
    },
  },
  app: {
    baseUrl: env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    name: 'Flowsvault',
    version: '1.0.0',
  },
} as const;
