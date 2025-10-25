import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { SessionWithUser } from '@/types/next-auth';
import { authOptions } from '@/lib/auth';
import { generateSignedUrl, getFileMetadataFromR2 } from '@/lib/r2-storage';
import {
  getFileByFileName,
  getFileById,
  getFileByOriginalNameAndUser,
  softDeleteFile,
} from '@/lib/db/utils';

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

const isPreviewableType = (mimeType: string): boolean => {
  const previewableTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
  ]);

  return previewableTypes.has(mimeType.toLowerCase());
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session as SessionWithUser | null)?.user?.id;

  if (!session || !userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }

  const { id } = await params;
  const identifier = decodeURIComponent(id);
  const fileRecord = await resolveFileForUser(identifier, userId);

  if (!fileRecord) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  if (fileRecord.expiresAt && fileRecord.expiresAt < new Date()) {
    await softDeleteFile(fileRecord.id);
    return NextResponse.json({ success: false, error: 'File expired' }, { status: 410 });
  }

  let mimeType: string;
  try {
    const metadata = await getFileMetadataFromR2(fileRecord.fileName);
    mimeType = metadata.mimeType;
  } catch (error: unknown) {
    if (
      (error instanceof Error && error.name === 'NoSuchKey') ||
      (error instanceof Error && (error as { code?: string }).code === 'FILE_NOT_FOUND')
    ) {
      await softDeleteFile(fileRecord.id);
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }
    console.error('Preview metadata lookup failed:', error);
    return NextResponse.json({ success: false, error: 'File not found or access error' }, { status: 404 });
  }

  if (!isPreviewableType(mimeType)) {
    return NextResponse.json({
      success: false,
      error: `File type ${mimeType} not supported for preview`,
    }, { status: 415 });
  }

  try {
    const signedUrl = await generateSignedUrl(fileRecord.fileName);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ success: false, error: 'File not found or access error' }, { status: 404 });
  }
}
