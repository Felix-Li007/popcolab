-- Rename table user_preference -> history_preference
BEGIN;

ALTER TABLE "user_preference" RENAME TO "history_preference";

-- Rename primary key constraint
ALTER TABLE "history_preference"
RENAME CONSTRAINT "user_preference_pkey" TO "history_preference_pkey";

-- Rename sequence created by SERIAL (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'user_preference_id_seq') THEN
        EXECUTE 'ALTER SEQUENCE "user_preference_id_seq" RENAME TO "history_preference_id_seq"';
        EXECUTE 'ALTER SEQUENCE "history_preference_id_seq" OWNED BY "history_preference"."id"';
    END IF;
END$$;

-- Rename index
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_preference_user_id_source_window_idx') THEN
        EXECUTE 'ALTER INDEX "user_preference_user_id_source_window_idx" RENAME TO "history_preference_user_id_source_window_idx"';

END IF;

END$$;

-- Rename foreign key constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_preference_user_id_fkey') THEN
        EXECUTE 'ALTER TABLE "history_preference" RENAME CONSTRAINT "user_preference_user_id_fkey" TO "history_preference_user_id_fkey"';
    END IF;
END$$;

COMMIT;