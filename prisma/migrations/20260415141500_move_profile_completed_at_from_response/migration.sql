ALTER TABLE "personality_profile"
ADD COLUMN "completed_at" TIMESTAMP(6);

UPDATE "personality_profile" AS profile
SET "completed_at" = response."completed_at"
FROM "response" AS response
WHERE profile."response_id" = response."id";

ALTER TABLE "personality_profile"
DROP CONSTRAINT "personality_profile_response_id_fkey";

ALTER TABLE "personality_profile"
DROP COLUMN "response_id";
