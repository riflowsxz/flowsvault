import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SessionWithUser } from '@/types/next-auth';
import { extractApiKeyFromHeader, verifyApiKey } from '@/lib/api-key';
import { getAllActiveApiKeys, updateApiKeyLastUsed } from '@/lib/db/utils';

export interface AuthResult {
  authenticated: boolean;
  userId: string | null;
  authMethod: 'session' | 'apiKey' | null;
  apiKeyId?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader) {
    const apiKey = extractApiKeyFromHeader(authHeader);
    
    if (apiKey) {
      const activeKeys = await getAllActiveApiKeys();
      
      for (const keyRecord of activeKeys) {
        const isValid = await verifyApiKey(apiKey, keyRecord.hashedKey);
        
        if (isValid) {
          updateApiKeyLastUsed(keyRecord.id).catch((error) => {
            console.error('Failed to update API key last used:', error);
          });
          
          return {
            authenticated: true,
            userId: keyRecord.userId,
            authMethod: 'apiKey',
            apiKeyId: keyRecord.id,
          };
        }
      }
      
      return {
        authenticated: false,
        userId: null,
        authMethod: null,
      };
    }
  }
  
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as SessionWithUser | null)?.user?.id;
    
    if (session && userId) {
      return {
        authenticated: true,
        userId,
        authMethod: 'session',
      };
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }

  return {
    authenticated: false,
    userId: null,
    authMethod: null,
  };
}
