import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import bcrypt from 'bcryptjs';

const API_KEY_PREFIX = 'fv';
const API_KEY_LENGTH = 20;

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-32-byte-encryption-key!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export function generateApiKey(): { key: string; prefix: string } {
  const randomPart = randomBytes(API_KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}-${randomPart}`;
  
  const displayPrefix = `${API_KEY_PREFIX}-${randomPart.slice(0, 4)}...${randomPart.slice(-4)}`;
  
  return {
    key,
    prefix: displayPrefix,
  };
}

export function encryptApiKey(key: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptApiKey(encryptedKey: string): string {
  const parts = encryptedKey.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export async function hashApiKey(key: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(key, salt);
}

export async function verifyApiKey(key: string, hashedKey: string): Promise<boolean> {
  try {
    return await bcrypt.compare(key, hashedKey);
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

export function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const key = parts[1];
  
  if (!key.startsWith(`${API_KEY_PREFIX}-`)) {
    return null;
  }

  return key;
}
