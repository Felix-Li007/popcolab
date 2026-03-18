DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'IntakeForm'
  ) THEN
    ALTER TYPE "IntakeForm" ADD VALUE IF NOT EXISTS 'EXPERIENCE';
  END IF;
END $$;
