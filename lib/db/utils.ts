import { randomUUID } from 'node:crypto';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from './index';
import { deleteFileFromR2 } from '../r2-storage';
import { fileMetadata, fileShares, uploadSessions, users, apiKeys } from './schema';

export const getUserByEmail = async (email: string) => {
  return db.select().from(users).where(eq(users.email, email)).limit(1);
};

export const getUserById = async (id: string) => {
  return db.select().from(users).where(eq(users.id, id)).limit(1);
};

export const createUser = async (userData: {
  email: string;
  name?: string;
  image?: string;
}) => {
  const [newUser] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      ...userData,
    })
    .returning();
  return newUser;
};

export const updateUserProfile = async (id: string, updates: {
  name?: string;
  image?: string | null;
}) => {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
};

export const deleteUserAccount = async (id: string) => {
  await db.transaction(async (tx) => {
    const files = await tx
      .select()
      .from(fileMetadata)
      .where(eq(fileMetadata.userId, id));

    if (files.length > 0) {
      await Promise.allSettled(
        files.map(async (file) => {
          try {
            await deleteFileFromR2(file.fileName);
          } catch (error) {
            console.error(`Failed to delete file ${file.fileName} from R2 during account removal`, error);
          }
        }),
      );
    }

    if (files.length > 0) {
      await tx.delete(fileMetadata).where(eq(fileMetadata.userId, id));
    }

    await tx.delete(uploadSessions).where(eq(uploadSessions.userId, id));
    await tx.delete(fileShares).where(eq(fileShares.sharedByUserId, id));
    await tx.delete(apiKeys).where(eq(apiKeys.userId, id));
    await tx.delete(users).where(eq(users.id, id));
  });
};

export const createFileMetadata = async (fileData: {
  originalName: string;
  fileName: string;
  size: number;
  mimeType: string;
  extension: string;
  downloadUrl: string;
  duration?: string;
  userId: string;
  expiresAt?: Date;
}) => {
  const [newFile] = await db
    .insert(fileMetadata)
    .values({
      id: randomUUID(),
      ...fileData,
      duration: fileData.duration || 'unlimited',
    })
    .returning();
  return newFile;
};

export const getFilesByUser = async (userId: string) => {
  return db
    .select()
    .from(fileMetadata)
    .where(and(eq(fileMetadata.userId, userId), eq(fileMetadata.isDeleted, false)));
};

export const getFileByOriginalNameAndUser = async (originalName: string, userId: string) => {
  return db
    .select()
    .from(fileMetadata)
    .where(
      and(
        eq(fileMetadata.originalName, originalName),
        eq(fileMetadata.userId, userId),
        eq(fileMetadata.isDeleted, false),
      ),
    );
};

export const getFileById = async (id: string) => {
  return db
    .select()
    .from(fileMetadata)
    .where(and(eq(fileMetadata.id, id), eq(fileMetadata.isDeleted, false)))
    .limit(1);
};

export const getFileByFileName = async (fileName: string) => {
  return db
    .select()
    .from(fileMetadata)
    .where(and(eq(fileMetadata.fileName, fileName), eq(fileMetadata.isDeleted, false)))
    .limit(1);
};

export const softDeleteFile = async (id: string) => {
  return db
    .update(fileMetadata)
    .set({ isDeleted: true })
    .where(eq(fileMetadata.id, id));
};

export const getExpiredFiles = async () => {
  return db
    .select()
    .from(fileMetadata)
    .where(
      and(
        sql`expires_at IS NOT NULL`,
        sql`expires_at < NOW()`,
        eq(fileMetadata.isDeleted, false),
      ),
    );
};

export const createUploadSession = async (sessionData: {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}) => {
  const [newSession] = await db
    .insert(uploadSessions)
    .values({
      id: randomUUID(),
      status: 'active',
      ...sessionData,
    })
    .returning();
  return newSession;
};

export const getActiveUploadSession = async (sessionId: string) => {
  return db
    .select()
    .from(uploadSessions)
    .where(
      and(
        eq(uploadSessions.sessionId, sessionId),
        eq(uploadSessions.status, 'active'),
        sql`expires_at > NOW()`,
      ),
    )
    .limit(1);
};

export const deactivateUploadSession = async (sessionId: string) => {
  return db
    .update(uploadSessions)
    .set({ status: 'inactive' })
    .where(eq(uploadSessions.sessionId, sessionId));
};

interface CleanupResult {
  processedCount: number;
  deletedCount: number;
  errorCount: number;
}

export const cleanupExpiredRecords = async () => {
  const expiredFiles = await getExpiredFiles();

  if (expiredFiles.length > 0) {
    await Promise.allSettled(
      expiredFiles.map(async (file) => {
        try {
          await deleteFileFromR2(file.fileName);
        } catch (error) {
          console.error(`Failed to delete expired file ${file.fileName} from R2`, error);
        }
      }),
    );

    await db
      .update(fileMetadata)
      .set({ isDeleted: true })
      .where(inArray(fileMetadata.id, expiredFiles.map((file) => file.id)));
  }

  await db
    .delete(uploadSessions)
    .where(sql`expires_at < NOW() OR status = 'inactive'`);

  await db
    .delete(fileShares)
    .where(sql`expires_at < NOW()`);
};

export const cleanupExpiredRecordsWithResults = async (): Promise<CleanupResult> => {
  let errorCount = 0;
  const expiredFiles = await getExpiredFiles();
  const processedCount = expiredFiles.length;

  if (expiredFiles.length > 0) {
    const results = await Promise.allSettled(
      expiredFiles.map(async (file) => {
        try {
          await deleteFileFromR2(file.fileName);
          return 'success';
        } catch (error) {
          console.error(`Failed to delete expired file ${file.fileName} from R2`, error);
          errorCount++;
          return 'error';
        }
      }),
    );

    const successfulDeletions = results.filter(result => result.status === 'fulfilled' && result.value === 'success');
    const deletedCount = successfulDeletions.length;

    await db
      .update(fileMetadata)
      .set({ isDeleted: true })
      .where(inArray(fileMetadata.id, expiredFiles.map((file) => file.id)));

    await db
      .delete(uploadSessions)
      .where(sql`expires_at < NOW() OR status = 'inactive'`);

    await db
      .delete(fileShares)
      .where(sql`expires_at < NOW()`);

    return { processedCount, deletedCount, errorCount };
  }

  await db
    .delete(uploadSessions)
    .where(sql`expires_at < NOW() OR status = 'inactive'`);

  await db
    .delete(fileShares)
    .where(sql`expires_at < NOW()`);

  return { processedCount, deletedCount: 0, errorCount };
};

export const createApiKey = async (keyData: {
  userId: string;
  name: string;
  hashedKey: string;
  encryptedKey: string;
  prefix: string;
}) => {
  const [newKey] = await db
    .insert(apiKeys)
    .values({
      id: randomUUID(),
      ...keyData,
    })
    .returning();
  return newKey;
};

export const getApiKeysByUserId = async (userId: string) => {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      hashedKey: apiKeys.hashedKey,
      encryptedKey: apiKeys.encryptedKey,
      prefix: apiKeys.prefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), sql`revoked_at IS NULL`))
    .orderBy(sql`created_at DESC`);
};

export const getApiKeyByPrefix = async (prefix: string) => {
  return db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.prefix, prefix), sql`revoked_at IS NULL`))
    .limit(1);
};

export const getAllActiveApiKeys = async () => {
  return db
    .select()
    .from(apiKeys)
    .where(sql`revoked_at IS NULL`);
};

export const updateApiKeyLastUsed = async (id: string) => {
  return db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, id));
};

export const revokeApiKey = async (id: string, userId: string) => {
  const [revokedKey] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();
  return revokedKey;
};

export const deleteApiKeysByUserId = async (userId: string) => {
  return db
    .delete(apiKeys)
    .where(eq(apiKeys.userId, userId));
};
