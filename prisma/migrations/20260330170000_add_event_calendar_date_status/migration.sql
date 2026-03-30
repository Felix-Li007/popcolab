DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'DateStatus'
  ) THEN
    CREATE TYPE "DateStatus" AS ENUM ('VALID', 'CANCELLED');
  END IF;
END $$;

ALTER TABLE "event_calendar"
ADD COLUMN "date_status" "DateStatus" NOT NULL DEFAULT 'VALID';
