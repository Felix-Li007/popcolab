DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ExperienceCalendarStatus'
  ) THEN
    CREATE TYPE "ExperienceCalendarStatus" AS ENUM ('locked', 'blocked');
  END IF;
END $$;

ALTER TABLE "experience_calendar"
ALTER COLUMN "calendar_status" TYPE "ExperienceCalendarStatus"
USING ("calendar_status"::text::"ExperienceCalendarStatus");
