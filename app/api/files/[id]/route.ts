import { NextRequest, NextResponse } from 'next/server';

import { APP_CONFIG } from '@/lib/config';
import { deleteFileFromR2, getFileMetadataFromR2 } from '@/lib/r2-storage';
import {
  getFileByFileName,
  getFileById,
  getFileByOriginalNameAndUser,
  softDeleteFile,
} from '@/lib/db/utils';
import { authenticateRequest } from '@/lib/auth-helper';

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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

const resolveFileForUser = async (identifier: string, userId: string) => {
  if (isValidUUID(identifier)) {
    const [byId] = await getFileById(identifier);
    if (byId && byId.userId === userId) {
      return byId;
    }
  }

  const [byFileName] = await getFileByFileName(identifier);
  if (byFileName && byFileName.userId === userId) {
    return byFileName;
  }

  const matchingByOriginal = await getFileByOriginalNameAndUser(identifier, userId);
  if (matchingByOriginal.length > 0) {
    return matchingByOriginal[0];
  }

  return null;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }

  const userId = auth.userId;

  const { id } = await params;
  const identifier = decodeURIComponent(id);
  const fileRecord = await resolveFileForUser(identifier, userId);

  if (!fileRecord) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  if (fileRecord.expiresAt && fileRecord.expiresAt < new Date()) {
    try {
      await softDeleteFile(fileRecord.id);
      await deleteFileFromR2(fileRecord.fileName);
    } catch (cleanupError) {
      console.error('Error cleaning up expired file:', cleanupError);
    }
    return NextResponse.json({ success: false, error: 'File expired' }, { status: 410 });
  }

  try {
    await getFileMetadataFromR2(fileRecord.fileName);
  } catch (error: unknown) {
    if (
      (error instanceof Error && error.name === 'NoSuchKey') ||
      (error instanceof Error && (error as { code?: string }).code === 'FILE_NOT_FOUND')
    ) {
      await softDeleteFile(fileRecord.id);
      console.warn(`File ${fileRecord.fileName} not found in R2, removed from database`);
      return NextResponse.json({ success: false, error: 'File not found in storage' }, { status: 404 });
    }
    console.error('Error checking file in R2 storage:', error);
    throw error;
  }

  const origin = getBaseUrl(request);

  return NextResponse.json({
    success: true,
    data: {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      fileName: fileRecord.fileName,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      extension: fileRecord.extension,
      uploadedAt: fileRecord.uploadedAt,
      expiresAt: fileRecord.expiresAt,
      downloadUrl: new URL(fileRecord.downloadUrl, origin).toString(),
      duration: fileRecord.duration,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }

  const userId = auth.userId;

  const { id } = await params;
  const identifier = decodeURIComponent(id);
  const fileRecord = await resolveFileForUser(identifier, userId);

  if (!fileRecord) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  if (fileRecord.expiresAt && fileRecord.expiresAt < new Date()) {
    try {
      await softDeleteFile(fileRecord.id);
      await deleteFileFromR2(fileRecord.fileName);
    } catch (cleanupError) {
      console.error('Error during expired file cleanup:', cleanupError);
    }
    return NextResponse.json({ success: false, error: 'File expired' }, { status: 410 });
  }

  try {
    await getFileMetadataFromR2(fileRecord.fileName);
  } catch (error: unknown) {
    if (
      (error instanceof Error && error.name === 'NoSuchKey') ||
      (error instanceof Error && (error as { code?: string }).code === 'FILE_NOT_FOUND')
    ) {
      await softDeleteFile(fileRecord.id);
      console.warn(`File ${fileRecord.fileName} not found in R2, removed from database`);
      return NextResponse.json({
        success: true,
        message: 'File record removed (file not found in storage)',
      });
    }
    console.error('Error verifying file in R2 before deletion:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error verifying file status before deletion',
      },
      { status: 500 },
    );
  }

  try {
    await deleteFileFromR2(fileRecord.fileName);
    await softDeleteFile(fileRecord.id);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting file from R2:', error);

    if (
      (error instanceof Error && error.name === 'NoSuchKey') ||
      (error instanceof Error && (error as { Code?: string }).Code === 'NoSuchKey') ||
      (error instanceof Error && (error as { code?: string }).code === 'FILE_NOT_FOUND')
    ) {
      await softDeleteFile(fileRecord.id);
      return NextResponse.json({
        success: true,
        message: 'File record removed (file not found in storage)',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file from storage',
      },
      { status: 500 },
    );
  }
}
