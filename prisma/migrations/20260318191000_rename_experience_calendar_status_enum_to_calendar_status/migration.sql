DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ExperienceCalendarStatus'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'CalendarStatus'
  ) THEN
    ALTER TYPE "ExperienceCalendarStatus" RENAME TO "CalendarStatus";
  END IF;
END $$;
