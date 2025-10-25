import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from './env';
import type { Readable } from 'node:stream';

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string | null;
}

const normalizePublicBaseUrl = (rawValue: string | undefined): string | null => {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(normalized);
    if (!url.pathname.endsWith('/')) {
      url.pathname = `${url.pathname}/`;
    }
    return url.toString();
  } catch (error) {
    console.warn('Invalid CLOUDFLARE_R2_PUBLIC_BASE_URL; falling back to signed URLs.', error);
    return null;
  }
};

let cachedConfig: R2Config | null = null;
let cachedClient: S3Client | null = null;

const loadConfig = (): R2Config => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const endpoint = env.CLOUDFLARE_R2_ENDPOINT?.trim();
  const accessKeyId = env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  const bucketName = env.CLOUDFLARE_R2_BUCKET?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Cloudflare R2 configuration is incomplete. Please check the required environment variables.');
  }

  cachedConfig = {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl: normalizePublicBaseUrl(env.CLOUDFLARE_R2_PUBLIC_BASE_URL ?? undefined),
  };

  return cachedConfig;
};

const getClient = (): S3Client => {
  if (cachedClient) {
    return cachedClient;
  }

  const config = loadConfig();

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
};

interface R2FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimeType: string;
  extension: string;
  uploadedAt: Date;
  expiresAt: Date | null;
  downloadUrl: string;
  duration?: string | null;
  userId?: string | null;
}

interface R2ObjectSummary {
  key: string;
  lastModified?: Date;
}

const ensureBucket = (): string => loadConfig().bucketName;

async function uploadFileToR2(
  fileBody: Buffer | Readable,
  fileName: string,
  originalName: string,
  mimeType: string,
  size: number,
  options: {
    expiresAt?: Date | null;
    duration?: string | null;
    userId?: string | null;
  } = {}
): Promise<R2FileMetadata> {
  const bucketName = ensureBucket();
  const client = getClient();
  const { publicBaseUrl } = loadConfig();

  const uploadedAt = new Date();
  const { expiresAt = null, duration = null, userId = null } = options;

  const metadataHeaders: Record<string, string> = {
    originalName: encodeURIComponent(originalName),
    uploadedAt: uploadedAt.toISOString(),
  };

  if (expiresAt) {
    metadataHeaders.expiresAt = expiresAt.toISOString();
  }

  if (duration) {
    metadataHeaders.duration = duration;
  }

  if (userId) {
    metadataHeaders.userId = userId;
  }

  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBody,
    ContentType: mimeType,
    ContentLength: size,
    Metadata: metadataHeaders,
  };

  const command = new PutObjectCommand(uploadParams);
  await client.send(command);

  const downloadUrl = publicBaseUrl ? new URL(fileName, publicBaseUrl).toString() : await generateSignedUrl(fileName);

  return {
    id: fileName,
    originalName,
    fileName,
    size,
    mimeType,
    extension: fileName.split('.').pop() || '',
    uploadedAt,
    expiresAt,
    downloadUrl,
    duration,
    userId,
  };
}

async function downloadFileFromR2(fileName: string): Promise<{ buffer: Buffer; metadata: Record<string, string> | undefined }> {
  const bucketName = ensureBucket();
  const client = getClient();

  const downloadParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  const command = new GetObjectCommand(downloadParams);
  const response = await client.send(command);

  let buffer: Uint8Array | undefined;

  if (response.Body) {
    buffer = await response.Body.transformToByteArray();
  }

  return {
    buffer: Buffer.from(buffer || []),
    metadata: response.Metadata,
  };
}

async function deleteFileFromR2(fileName: string): Promise<void> {
  const bucketName = ensureBucket();
  const client = getClient();

  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  const command = new DeleteObjectCommand(deleteParams);
  await client.send(command);
}

async function getFileMetadataFromR2(
  fileName: string
): Promise<{ size: number; mimeType: string; metadata: Record<string, string> | undefined }> {
  const bucketName = ensureBucket();
  const client = getClient();

  const headParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    const command = new HeadObjectCommand(headParams);
    const response = await client.send(command);

    return {
      size: response.ContentLength || 0,
      mimeType: response.ContentType || 'application/octet-stream',
      metadata: response.Metadata,
    };
  } catch (error: unknown) {
    console.error('Error getting file metadata from R2:', error);
    if (
      (error instanceof Error && error.name === 'NoSuchKey') ||
      (error instanceof Error && (error as { Code?: string }).Code === 'NoSuchKey') ||
      (error instanceof Error && (error as { message?: string }).message?.includes('NoSuchKey')) ||
      (error instanceof Error && (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
    ) {
      const notFoundError = new Error(`File ${fileName} not found in R2 storage`);
      (notFoundError as { code?: string }).code = 'FILE_NOT_FOUND';
      throw notFoundError;
    }
    throw error;
  }
}

async function generateSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
  const bucketName = ensureBucket();
  const client = getClient();
  const { publicBaseUrl } = loadConfig();

  if (publicBaseUrl) {
    return new URL(fileName, publicBaseUrl).toString();
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  return getSignedUrl(client, command, { expiresIn });
}

async function listFilesInR2(prefix?: string): Promise<R2ObjectSummary[]> {
  const bucketName = ensureBucket();
  const client = getClient();

  const results: R2ObjectSummary[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(command);
    const contents = response.Contents ?? [];

    for (const object of contents) {
      if (!object.Key) continue;
      results.push({
        key: object.Key,
        lastModified: object.LastModified ? new Date(object.LastModified) : undefined,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return results;
}


export {
  uploadFileToR2,
  downloadFileFromR2,
  deleteFileFromR2,
  getFileMetadataFromR2,
  generateSignedUrl,
  listFilesInR2,
  type R2FileMetadata,
};
