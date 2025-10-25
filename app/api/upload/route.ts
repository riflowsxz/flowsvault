import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import path from 'node:path';
import busboy from 'busboy';

import { NextRequest, NextResponse } from 'next/server';

import { APP_CONFIG } from '@/lib/config';
import { uploadFileToR2 } from '@/lib/r2-storage';
import { createFileMetadata, getFilesByUser } from '@/lib/db/utils';
import { uploadSchema as uploadOptionsSchema } from '@/lib/validators';
import { authenticateRequest } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

const ALLOWED_EXTENSIONS = new Set(
  APP_CONFIG.upload.allowedExtensions.map((extension) => extension.toLowerCase()),
);

const sanitizeFileName = (fileName: string) =>
  fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 255) || `file_${Date.now()}`;

const buildStorageKey = (originalName: string) => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = sanitizeFileName(extension ? originalName.slice(0, -extension.length) : originalName);
  return `${randomUUID()}-${baseName || 'file'}${extension}`;
};

const getBaseUrl = (request: NextRequest): string => {
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  try {
    return request.nextUrl.origin;
  } catch {
    return APP_CONFIG.app.baseUrl;
  }
};

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 },
      );
    }

    const userId = auth.userId;

    if (APP_CONFIG.upload.isVercel) {
      console.log('Upload request on vercel (4.5MB limit enforced)');
    }

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be multipart/form-data', code: 'INVALID_CONTENT_TYPE' },
        { status: 400 },
      );
    }

    return new Promise<NextResponse>((resolve) => {
      const bb = busboy({
        headers: Object.fromEntries(request.headers.entries()),
        limits: {
          fileSize: APP_CONFIG.upload.maxFileSize,
          files: 1,
        },
      });

      let fileInfo: {
        originalName: string;
        fileName: string;
        mimeType: string;
        size: number;
        storageKey: string;
      } | null = null;

      const fields: Record<string, string> = {};
      let uploadError: { success: false; error: string; code: string; status: number } | null = null;
      let uploadPromise: Promise<void> | null = null;

      bb.on('field', (name, value) => {
        fields[name] = value;
      });

      bb.on('file', async (name, file, info) => {
        if (name !== 'file') {
          file.resume();
          return;
        }

        const { filename, mimeType } = info;
        const fileExtension = path.extname(filename).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(fileExtension)) {
          uploadError = {
            success: false,
            error: `File type ${fileExtension || 'unknown'} not allowed`,
            code: 'INVALID_FILE_TYPE',
            status: 400,
          };
          file.resume();
          return;
        }

        const storageKey = buildStorageKey(filename);
        const chunks: Buffer[] = [];
        let fileSize = 0;

        file.on('data', (chunk: Buffer) => {
          fileSize += chunk.length;
          if (fileSize > APP_CONFIG.upload.maxFileSize) {
            uploadError = {
              success: false,
              error: `Max size ${Math.floor(APP_CONFIG.upload.maxFileSize / (1024 * 1024))}MB`,
              code: 'FILE_TOO_LARGE',
              status: 400,
            };
            file.resume();
            chunks.length = 0;
            return;
          }
          chunks.push(chunk);
        });

        file.on('end', () => {
          if (uploadError || chunks.length === 0) {
            return;
          }

          const fileBuffer = Buffer.concat(chunks);
          chunks.length = 0;

        uploadPromise = (async () => {
        try {
          const durationParam = fields.duration;
          const metadataParam = fields.metadata;

          let parsedMetadata: unknown = {};

          if (typeof metadataParam === 'string' && metadataParam.trim().length > 0) {
            try {
              parsedMetadata = JSON.parse(metadataParam);
            } catch {
              uploadError = {
                success: false,
                error: 'Invalid metadata format',
                code: 'INVALID_METADATA',
                status: 400,
              };
              return;
            }
          }

          const validationResult = uploadOptionsSchema.safeParse({
            duration:
              typeof durationParam === 'string' && durationParam.trim().length > 0 ? durationParam : undefined,
            metadata: parsedMetadata,
          });

          if (!validationResult.success) {
            const firstIssue = validationResult.error.issues[0]?.message ?? 'Invalid upload options';
            uploadError = {
              success: false,
              error: firstIssue,
              code: 'INVALID_UPLOAD_OPTIONS',
              status: 400,
            };
            return;
          }

          const { duration } = validationResult.data;
          const durationConfig = APP_CONFIG.upload.durations[duration];
          const expiresAt = durationConfig?.ms != null ? new Date(Date.now() + durationConfig.ms) : null;

          await uploadFileToR2(fileBuffer, storageKey, filename, mimeType || 'application/octet-stream', fileSize, {
            expiresAt,
            duration,
            userId,
          });

          fileInfo = {
            originalName: filename,
            fileName: storageKey,
            mimeType: mimeType || 'application/octet-stream',
            size: fileSize,
            storageKey,
          };
        } catch (error) {
          console.error('Error uploading file to R2:', error);
          uploadError = {
            success: false,
            error: 'Error uploading to storage',
            code: 'UPLOAD_ERROR',
            status: 500,
          };
        }
        })();
        });
      });

      bb.on('finish', async () => {
        if (uploadPromise) {
          await uploadPromise;
        }

        if (uploadError) {
          resolve(NextResponse.json(uploadError, { status: uploadError.status }));
          return;
        }

        if (!fileInfo) {
          resolve(
            NextResponse.json(
              { success: false, error: 'No file provided', code: 'NO_FILE' },
              { status: 400 },
            ),
          );
          return;
        }

        try {
          const durationParam = fields.duration;
          const validationResult = uploadOptionsSchema.safeParse({
            duration:
              typeof durationParam === 'string' && durationParam.trim().length > 0 ? durationParam : undefined,
          });

          if (!validationResult.success) {
            resolve(
              NextResponse.json(
                {
                  success: false,
                  error: 'Invalid upload options',
                  code: 'INVALID_UPLOAD_OPTIONS',
                },
                { status: 400 },
              ),
            );
            return;
          }

          const { duration } = validationResult.data;
          const durationConfig = APP_CONFIG.upload.durations[duration];
          const expiresAt = durationConfig?.ms != null ? new Date(Date.now() + durationConfig.ms) : null;

          const storedMetadata = await createFileMetadata({
            originalName: fileInfo.originalName,
            fileName: fileInfo.storageKey,
            size: fileInfo.size,
            mimeType: fileInfo.mimeType,
            extension: path.extname(fileInfo.originalName).toLowerCase(),
            downloadUrl: `/api/download/${encodeURIComponent(fileInfo.storageKey)}`,
            duration,
            userId,
            expiresAt: expiresAt ?? undefined,
          });

          const origin = getBaseUrl(request);

          resolve(
            NextResponse.json({
              success: true,
              data: {
                id: storedMetadata.id,
                originalName: storedMetadata.originalName,
                fileName: storedMetadata.fileName,
                size: storedMetadata.size,
                mimeType: storedMetadata.mimeType,
                extension: storedMetadata.extension,
                uploadedAt: storedMetadata.uploadedAt,
                expiresAt: storedMetadata.expiresAt,
                downloadUrl: new URL(storedMetadata.downloadUrl, origin).toString(),
                duration: storedMetadata.duration,
              },
              message: 'File uploaded successfully',
            }),
          );
        } catch (err) {
          console.error('Error creating file metadata:', err);
          resolve(
            NextResponse.json(
              { success: false, error: 'Error saving file metadata', code: 'METADATA_ERROR' },
              { status: 500 },
            ),
          );
        }
      });

      bb.on('error', (error) => {
        console.error('Busboy error:', error);
        resolve(
          NextResponse.json(
            { success: false, error: 'Error parsing upload', code: 'PARSE_ERROR' },
            { status: 500 },
          ),
        );
      });

      const nodeStream = Readable.fromWeb(request.body as unknown as WebReadableStream);
      nodeStream.pipe(bb);
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }

  const userId = auth.userId;

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const pageParam = Number(searchParams.get('page'));

  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 10;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const allFiles = await getFilesByUser(userId);

  const now = new Date();
  const validFiles = allFiles
    .filter((file) => !file.expiresAt || file.expiresAt > now)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const total = validFiles.length;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const effectivePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const start = limit > 0 ? (effectivePage - 1) * limit : 0;
  const end = limit > 0 ? start + limit : total;
  const paginatedFiles = limit > 0 ? validFiles.slice(start, end) : validFiles;

  const origin = getBaseUrl(request);

  return NextResponse.json({
    success: true,
    data: paginatedFiles.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      size: file.size,
      mimeType: file.mimeType,
      extension: file.extension,
      uploadedAt: file.uploadedAt,
      expiresAt: file.expiresAt,
      downloadUrl: new URL(file.downloadUrl, origin).toString(),
      duration: file.duration,
    })),
    pagination: {
      page: effectivePage,
      limit,
      total,
      totalPages,
    },
  });
}
