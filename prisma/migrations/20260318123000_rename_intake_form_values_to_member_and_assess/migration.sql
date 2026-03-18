DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'IntakeForm' AND e.enumlabel = 'USER'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'IntakeForm' AND e.enumlabel = 'MEMBER'
  ) THEN
    ALTER TYPE "IntakeForm" RENAME VALUE 'USER' TO 'MEMBER';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'IntakeForm' AND e.enumlabel = 'PLAY'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'IntakeForm' AND e.enumlabel = 'ASSESS'
  ) THEN
    ALTER TYPE "IntakeForm" RENAME VALUE 'PLAY' TO 'ASSESS';
  END IF;
END $$;
