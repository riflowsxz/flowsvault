CREATE INDEX "idx_file_metadata_user_id" ON "file_metadata" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_file_metadata_expires_at" ON "file_metadata" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_file_shares_file_user" ON "file_shares" USING btree ("file_id","shared_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");