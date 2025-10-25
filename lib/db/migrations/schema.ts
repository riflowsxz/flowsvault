import { pgTable, index, foreignKey, unique, uuid, varchar, timestamp, jsonb, text, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const fileShares = pgTable("file_shares", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fileId: uuid("file_id").notNull(),
	sharedByUserId: uuid("shared_by_user_id").notNull(),
	sharedWithUserId: uuid("shared_with_user_id"),
	shareToken: varchar("share_token", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	permissions: jsonb(),
}, (table) => [
	index("idx_file_shares_file_user").using("btree", table.fileId.asc().nullsLast().op("uuid_ops"), table.sharedByUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [fileMetadata.id],
			name: "file_shares_file_id_file_metadata_id_fk"
		}),
	foreignKey({
			columns: [table.sharedByUserId],
			foreignColumns: [users.id],
			name: "file_shares_shared_by_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.sharedWithUserId],
			foreignColumns: [users.id],
			name: "file_shares_shared_with_user_id_users_id_fk"
		}),
	unique("file_shares_share_token_unique").on(table.shareToken),
]);

export const uploadSessions = pgTable("upload_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionId: varchar("session_id", { length: 255 }).notNull(),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "upload_sessions_user_id_users_id_fk"
		}),
	unique("upload_sessions_session_id_unique").on(table.sessionId),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 64 }),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
]);

export const fileMetadata = pgTable("file_metadata", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	originalName: varchar("original_name", { length: 255 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	size: integer().notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	extension: varchar({ length: 10 }).notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	downloadUrl: varchar("download_url", { length: 500 }).notNull(),
	duration: varchar({ length: 20 }).default('unlimited').notNull(),
	userId: uuid("user_id").notNull(),
	isDeleted: boolean("is_deleted").default(false),
}, (table) => [
	index("idx_file_metadata_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_file_metadata_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "file_metadata_user_id_users_id_fk"
		}),
	unique("file_metadata_file_name_unique").on(table.fileName),
]);
