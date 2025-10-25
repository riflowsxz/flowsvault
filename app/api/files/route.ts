import { NextRequest, NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';
import { getFilesByUser } from '@/lib/db/utils';
import { authenticateRequest } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

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
