import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SessionWithUser } from '@/types/next-auth';
import { generateApiKey, hashApiKey, encryptApiKey, decryptApiKey } from '@/lib/api-key';
import { createApiKey, getApiKeysByUserId } from '@/lib/db/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as SessionWithUser | null)?.user?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const apiKeys = await getApiKeysByUserId(userId);

    return NextResponse.json({
      success: true,
      data: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        key: decryptApiKey(key.encryptedKey),
        prefix: key.prefix,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as SessionWithUser | null)?.user?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'API key name is required', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'API key name must be less than 100 characters', code: 'NAME_TOO_LONG' },
        { status: 400 }
      );
    }

    const existingKeys = await getApiKeysByUserId(userId);
    if (existingKeys.length >= 3) {
      return NextResponse.json(
        { success: false, error: 'Maximum API key limit reached. You can only have 3 API keys.', code: 'MAX_KEYS_REACHED' },
        { status: 400 }
      );
    }

    const { key, prefix } = generateApiKey();
    const hashedKey = await hashApiKey(key);
    const encryptedKey = encryptApiKey(key);

    const newKey = await createApiKey({
      userId,
      name: name.trim(),
      hashedKey: hashedKey,
      encryptedKey: encryptedKey,
      prefix,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newKey.id,
        name: newKey.name,
        key,
        prefix: newKey.prefix,
        createdAt: newKey.createdAt,
      },
      message: 'API key created successfully. save this key securely - it will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
