ALTER TABLE "invited_user"
RENAME COLUMN "invite_status" TO "invited_status";

ALTER TABLE "invited_user"
ADD COLUMN "invited_token" VARCHAR(255),
ADD COLUMN "user_name" VARCHAR(50),
ADD COLUMN "user_email" VARCHAR(255),
ADD COLUMN "expired_at" TIMESTAMP(6),
ADD COLUMN "respond_at" TIMESTAMP(6);

UPDATE "invited_user" AS iu
SET
  "invited_token" = md5(
    CONCAT_WS(':', iu."id"::text, iu."request_id"::text, iu."user_id"::text)
  ),
  "user_name" = LEFT(
    COALESCE(NULLIF(u."user_name", ''), SPLIT_PART(u."email", '@', 1), 'user'),
    50
  ),
  "user_email" = COALESCE(u."email", CONCAT('unknown+', iu."id"::text, '@example.invalid')),
  "expired_at" = r."expired_at",
  "respond_at" = iu."confirm_at"
FROM "request" AS r
JOIN "user" AS u
  ON u."id" = iu."user_id"
WHERE r."id" = iu."request_id";

ALTER TABLE "invited_user"
ALTER COLUMN "invited_token" SET NOT NULL,
ALTER COLUMN "user_name" SET NOT NULL,
ALTER COLUMN "user_email" SET NOT NULL;

ALTER TABLE "invited_user"
DROP CONSTRAINT "invited_user_user_id_fkey";

ALTER TABLE "invited_user"
DROP COLUMN "user_id",
DROP COLUMN "confirm_at";

CREATE UNIQUE INDEX "invited_user_invited_token_key"
ON "invited_user"("invited_token");

CREATE UNIQUE INDEX "invited_user_request_id_user_email_key"
ON "invited_user"("request_id", "user_email");
