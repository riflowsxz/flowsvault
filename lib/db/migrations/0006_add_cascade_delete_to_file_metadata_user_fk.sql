-- Drop the existing foreign key constraint
ALTER TABLE "file_metadata" DROP CONSTRAINT "file_metadata_user_id_users_id_fk";

-- Add the foreign key constraint with CASCADE ON DELETE
ALTER TABLE "file_metadata" ADD CONSTRAINT "file_metadata_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE no action;