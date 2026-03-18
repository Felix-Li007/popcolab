DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ExperienceStatus'
  ) THEN
    CREATE TYPE "ExperienceStatus" AS ENUM ('draft', 'inactive', 'active');
  END IF;
END $$;

ALTER TABLE "experience"
ADD COLUMN IF NOT EXISTS "experience_status" "ExperienceStatus" NOT NULL DEFAULT 'active';

UPDATE "experience"
SET "experience_status" = 'active'
WHERE "experience_status" IS NULL;
