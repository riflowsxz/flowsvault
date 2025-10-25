import { pgTable, uuid, varchar, text, integer, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 64 }),
    image: text('image'),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

export const fileMetadata = pgTable(
  'file_metadata',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull().unique(),
    size: integer('size').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    extension: varchar('extension', { length: 10 }).notNull(),
    uploadedAt: timestamp('uploaded_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    expiresAt: timestamp('expires_at'),
    downloadUrl: varchar('download_url', { length: 500 }).notNull(),
    duration: varchar('duration', { length: 20 }).notNull().default('unlimited'),
    userId: uuid('user_id').notNull().references(() => users.id),
    isDeleted: boolean('is_deleted').default(false),
  },
  (table) => ({
    userIdIdx: index('idx_file_metadata_user_id').on(table.userId),
    expiresAtIdx: index('idx_file_metadata_expires_at').on(table.expiresAt),
  })
);

export const fileShares = pgTable(
  'file_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => fileMetadata.id),
    sharedByUserId: uuid('shared_by_user_id')
      .notNull()
      .references(() => users.id),
    sharedWithUserId: uuid('shared_with_user_id').references(() => users.id),
    shareToken: varchar('share_token', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    expiresAt: timestamp('expires_at'),
    permissions: jsonb('permissions'),
  },
  (table) => ({
    fileUserIdx: index('idx_file_shares_file_user').on(table.fileId, table.sharedByUserId),
  })
);

export const uploadSessions = pgTable('upload_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp('expires_at').notNull(),
});

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    hashedKey: text('hashed_key').notNull(),
    encryptedKey: text('encrypted_key').notNull(),
    prefix: varchar('prefix', { length: 20 }).notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    lastUsedAt: timestamp('last_used_at'),
    revokedAt: timestamp('revoked_at'),
  },
  (table) => ({
    userIdIdx: index('idx_api_keys_user_id').on(table.userId),
    prefixIdx: index('idx_api_keys_prefix').on(table.prefix),
  })
);

