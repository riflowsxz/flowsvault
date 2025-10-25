CREATE TABLE "file_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"extension" varchar(10) NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"download_url" varchar(500) NOT NULL,
	"duration" varchar(20) DEFAULT 'unlimited' NOT NULL,
	"password_hash" varchar(64),
	"user_id" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "file_metadata_file_name_unique" UNIQUE("file_name")
);
--> statement-breakpoint
CREATE TABLE "file_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"shared_by_user_id" uuid NOT NULL,
	"shared_with_user_id" uuid,
	"share_token" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"permissions" jsonb,
	CONSTRAINT "file_shares_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "upload_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"name" varchar(64),
	"image" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "file_metadata" ADD CONSTRAINT "file_metadata_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_file_id_file_metadata_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_shared_by_user_id_users_id_fk" FOREIGN KEY ("shared_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;