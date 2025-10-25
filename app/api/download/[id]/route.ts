import { NextRequest, NextResponse } from 'next/server';

import {
  deleteFileFromR2,
  downloadFileFromR2,
  getFileMetadataFromR2,
} from '@/lib/r2-storage';
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

  const byOriginal = await getFileByOriginalNameAndUser(identifier, userId);
  if (byOriginal.length > 0) {
    return byOriginal[0];
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
    return NextResponse.json(
      { success: false, error: 'File not found', code: 'FILE_NOT_FOUND' },
      { status: 404 },
    );
  }

  if (fileRecord.userId !== userId) {
    return NextResponse.json(
      { success: false, error: 'Access denied', code: 'ACCESS_DENIED' },
      { status: 403 },
    );
  }

  if (fileRecord.expiresAt && fileRecord.expiresAt < new Date()) {
    await softDeleteFile(fileRecord.id);
    try {
      await deleteFileFromR2(fileRecord.fileName);
    } catch (error) {
      console.error('Failed to remove expired file from R2 during download attempt:', error);
    }
    return NextResponse.json(
      { success: false, error: 'File expired', code: 'FILE_EXPIRED' },
      { status: 410 },
    );
  }

  let mimeType: string;
  try {
    const metadataResult = await getFileMetadataFromR2(fileRecord.fileName);
    mimeType = metadataResult.mimeType;
  } catch (metadataError) {
    if (
      (metadataError instanceof Error && metadataError.name === 'NoSuchKey') ||
      (metadataError instanceof Error && (metadataError as { code?: string }).code === 'FILE_NOT_FOUND')
    ) {
      await softDeleteFile(fileRecord.id);
      console.error(`File ${fileRecord.fileName} exists in database but not in R2. Cleaning up database.`);
      return NextResponse.json(
        { success: false, error: 'File not found in storage system', code: 'FILE_MISSING_IN_STORAGE' },
        { status: 404 },
      );
    }
    console.error('Error getting metadata for file:', fileRecord.fileName, metadataError);
    return NextResponse.json(
      { success: false, error: 'Error accessing file metadata', code: 'METADATA_ERROR' },
      { status: 500 },
    );
  }

  let downloadResult;
  try {
    downloadResult = await downloadFileFromR2(fileRecord.fileName);
  } catch (downloadError) {
    if (
      (downloadError instanceof Error && downloadError.name === 'NoSuchKey') ||
      (downloadError instanceof Error && (downloadError as { code?: string }).code === 'FILE_NOT_FOUND')
    ) {
      await softDeleteFile(fileRecord.id);
      return NextResponse.json(
        { success: false, error: 'File not found in storage system', code: 'FILE_NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error('Download error:', downloadError);
    return NextResponse.json(
      { success: false, error: 'Internal server error during download', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }

  const downloadFileName = fileRecord.originalName || fileRecord.fileName;
  const encodedFileName = encodeURIComponent(downloadFileName)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const safeFileName = downloadFileName.replace(/[^\x20-\x7E]/g, '_');

  const headers = new Headers();
  headers.set('Content-Type', mimeType || fileRecord.mimeType || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
  headers.set('Content-Length', downloadResult.buffer.length.toString());
  headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  headers.set('Expires', '0');
  headers.set('Accept-Ranges', 'bytes');

  return new NextResponse(new Uint8Array(downloadResult.buffer), {
    status: 200,
    headers,
  });
}
