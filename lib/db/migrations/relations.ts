import { relations } from "drizzle-orm/relations";
import { fileMetadata, fileShares, users, uploadSessions } from "./schema";

export const fileSharesRelations = relations(fileShares, ({one}) => ({
	fileMetadatum: one(fileMetadata, {
		fields: [fileShares.fileId],
		references: [fileMetadata.id]
	}),
	user_sharedByUserId: one(users, {
		fields: [fileShares.sharedByUserId],
		references: [users.id],
		relationName: "fileShares_sharedByUserId_users_id"
	}),
	user_sharedWithUserId: one(users, {
		fields: [fileShares.sharedWithUserId],
		references: [users.id],
		relationName: "fileShares_sharedWithUserId_users_id"
	}),
}));

export const fileMetadataRelations = relations(fileMetadata, ({one, many}) => ({
	fileShares: many(fileShares),
	user: one(users, {
		fields: [fileMetadata.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	fileShares_sharedByUserId: many(fileShares, {
		relationName: "fileShares_sharedByUserId_users_id"
	}),
	fileShares_sharedWithUserId: many(fileShares, {
		relationName: "fileShares_sharedWithUserId_users_id"
	}),
	uploadSessions: many(uploadSessions),
	fileMetadata: many(fileMetadata),
}));

export const uploadSessionsRelations = relations(uploadSessions, ({one}) => ({
	user: one(users, {
		fields: [uploadSessions.userId],
		references: [users.id]
	}),
}));