-- Add encrypted_key column (nullable first)
ALTER TABLE "api_keys" ADD COLUMN "encrypted_key" text;

-- Delete all existing API keys since they're stored incorrectly
-- Users will need to regenerate them
DELETE FROM "api_keys";

-- Now make the column NOT NULL
ALTER TABLE "api_keys" ALTER COLUMN "encrypted_key" SET NOT NULL;