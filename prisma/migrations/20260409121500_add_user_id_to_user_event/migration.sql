ALTER TABLE "user_event"
ADD COLUMN "user_id" INTEGER;

INSERT INTO "user" (
  "clerk_id",
  "email",
  "user_name",
  "user_type",
  "status",
  "intake_complete",
  "personality_complete",
  "created_at",
  "updated_at"
)
SELECT
  'legacy-user-event-owner',
  'legacy-user-event-owner@local.invalid',
  'Legacy Booking Owner',
  'INDIVIDUAL',
  'active',
  false,
  false,
  NOW(),
  NOW()
WHERE EXISTS (
  SELECT 1
  FROM "user_event"
)
AND NOT EXISTS (
  SELECT 1
  FROM "user"
  WHERE "clerk_id" = 'legacy-user-event-owner'
);

UPDATE "user_event"
SET "user_id" = (
  SELECT "id"
  FROM "user"
  WHERE "clerk_id" = 'legacy-user-event-owner'
  LIMIT 1
)
WHERE "user_id" IS NULL;

ALTER TABLE "user_event"
ALTER COLUMN "user_id" SET NOT NULL;

CREATE INDEX "user_event_user_id_idx" ON "user_event"("user_id");

ALTER TABLE "user_event"
ADD CONSTRAINT "user_event_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
