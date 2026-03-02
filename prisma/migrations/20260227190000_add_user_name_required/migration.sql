-- AlterTable: add user_name as nullable first for safe backfill
ALTER TABLE "user"
ADD COLUMN "user_name" VARCHAR(50);

-- Backfill from profile name, then email local part, then deterministic fallback
UPDATE "user" AS u
SET "user_name" = LEFT(
  COALESCE(
    NULLIF(
      TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))),
      ''
    ),
    NULLIF(SPLIT_PART(u.email, '@', 1), ''),
    CONCAT('user_', u.id::text)
  ),
  50
)
FROM "profile" AS p
WHERE p.user_id = u.id
  AND u.user_name IS NULL;

UPDATE "user" AS u
SET "user_name" = LEFT(
  COALESCE(
    NULLIF(SPLIT_PART(u.email, '@', 1), ''),
    CONCAT('user_', u.id::text)
  ),
  50
)
WHERE u.user_name IS NULL;

-- Enforce non-null requirement
ALTER TABLE "user"
ALTER COLUMN "user_name" SET NOT NULL;

-- Keep inserts compatible while app rollout is in progress
ALTER TABLE "user"
ALTER COLUMN "user_name" SET DEFAULT 'user';
