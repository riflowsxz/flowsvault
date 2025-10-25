import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SessionWithUser } from '@/types/next-auth';
import { revokeApiKey } from '@/lib/db/utils';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as SessionWithUser | null)?.user?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'API key ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const revokedKey = await revokeApiKey(id, userId);

    if (!revokedKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
