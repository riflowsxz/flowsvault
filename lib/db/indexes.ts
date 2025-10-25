import { fileMetadata, users, fileShares } from './schema';
import { index } from 'drizzle-orm/pg-core';

export const idxFileMetadataUserId = index('idx_file_metadata_user_id').on(fileMetadata.userId);

export const idxFileMetadataExpiresAt = index('idx_file_metadata_expires_at').on(fileMetadata.expiresAt);

export const idxUsersEmail = index('idx_users_email').on(users.email);

export const idxFileSharesFileUser = index('idx_file_shares_file_user').on(
  fileShares.fileId,
  fileShares.sharedByUserId
);