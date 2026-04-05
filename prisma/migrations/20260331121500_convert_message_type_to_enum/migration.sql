-- Create enum type for message_type and convert existing column
BEGIN;

-- Create a new enum type with desired labels, map existing string values, and replace the old enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum_new') THEN
        CREATE TYPE message_type_enum_new AS ENUM ('EVENT_CANCELED', 'DATE_CANCELED');
    END IF;
END$$;

-- Alter column to the new enum type, mapping old stored strings to new labels
ALTER TABLE "notification"
  ALTER COLUMN "message_type" TYPE message_type_enum_new
  USING (
    CASE "message_type"
      WHEN 'event.canceled' THEN 'EVENT_CANCELED'::message_type_enum_new
      WHEN 'event.date_canceled' THEN 'DATE_CANCELED'::message_type_enum_new
      ELSE NULL
    END
  );

-- Drop old enum type if it exists, then rename new type to the canonical name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
        DROP TYPE message_type_enum;

END IF;

END$$;

ALTER TYPE message_type_enum_new RENAME TO message_type_enum;

-- Recreate index on enum column
DROP INDEX IF EXISTS "notification_message_type_idx";

CREATE INDEX IF NOT EXISTS "notification_message_type_idx" ON "notification" ("message_type");

COMMIT;