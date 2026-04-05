-- Rename column notification_type -> message_type and update index
BEGIN;

ALTER TABLE "notification"
RENAME COLUMN "notification_type" TO "message_type";

-- Drop old index if exists, create new index on renamed column
DROP INDEX IF EXISTS "notification_notification_type_idx";

CREATE INDEX IF NOT EXISTS "notification_message_type_idx" ON "notification" ("message_type");

COMMIT;