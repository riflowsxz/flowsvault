import { z } from 'zod';

import { APP_CONFIG } from './config';

const durationOptions = Object.keys(APP_CONFIG.upload.durations) as Array<keyof typeof APP_CONFIG.upload.durations>;
if (durationOptions.length === 0) {
  throw new Error('APP_CONFIG.upload.durations must contain at least one option');
}

const uploadDurationEnum = z.enum(durationOptions as [typeof durationOptions[number], ...typeof durationOptions]);

export const fileMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  size: z.number(),
  mimeType: z.string(),
  extension: z.string(),
  uploadedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  downloadUrl: z.string().url(),
  duration: z.string().optional(),
  userId: z.string().optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export const uploadSchema = z.object({
  duration: uploadDurationEnum.optional().default('unlimited'),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export const fileQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['uploadedAt', 'size', 'name']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  extension: z.string().optional(),
});

export function validateFile(file: File) {
  const errors: string[] = [];

  if (!file || !(file instanceof File)) {
    errors.push('Invalid file');
    return {
      isValid: false,
      errors,
    };
  }

  if (!file.size || file.size === 0) {
    errors.push('File is empty');
  } else if (file.size > APP_CONFIG.upload.maxFileSize) {
    const maxMb = Math.floor(APP_CONFIG.upload.maxFileSize / (1024 * 1024));
    errors.push(`File size exceeds the maximum of ${maxMb}MB`);
  }

  if (!file.name || file.name.trim() === '') {
    errors.push('Invalid file name');
  }

  const nameParts = file.name.split('.');
  const hasExtension = nameParts.length > 1;
  const extensionSegment = hasExtension ? nameParts.pop() ?? '' : '';
  const extension = extensionSegment ? `.${extensionSegment.toLowerCase()}` : '';
  if (extension && !(APP_CONFIG.upload.allowedExtensions as readonly string[]).includes(extension)) {
    errors.push(`File type ${extension} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
