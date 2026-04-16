ALTER TABLE "invited_user" RENAME TO "request_user";

ALTER TABLE "request_user"
  RENAME CONSTRAINT "invited_user_pkey" TO "request_user_pkey";

ALTER TABLE "request_user"
  RENAME CONSTRAINT "invited_user_request_id_fkey" TO "request_user_request_id_fkey";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invited_user_user_id_fkey'
  ) THEN
    ALTER TABLE "request_user"
      RENAME CONSTRAINT "invited_user_user_id_fkey" TO "request_user_user_id_fkey";
  END IF;
END $$;

ALTER INDEX IF EXISTS "invited_user_invited_token_key"
  RENAME TO "request_user_invited_token_key";

ALTER INDEX IF EXISTS "invited_user_request_id_user_email_key"
  RENAME TO "request_user_request_id_user_email_key";
