ALTER TABLE "personality_profile"
ALTER COLUMN "completed_at" TYPE TIMESTAMP(6)
USING CASE
  WHEN "completed_at" IS NULL THEN NULL
  ELSE "completed_at" AT TIME ZONE 'America/Winnipeg'
END;

ALTER TABLE "personality_profile"
ALTER COLUMN "created_at" TYPE TIMESTAMP(6)
USING "created_at" AT TIME ZONE 'America/Winnipeg';

ALTER TABLE "personality_profile"
ALTER COLUMN "updated_at" TYPE TIMESTAMP(6)
USING "updated_at" AT TIME ZONE 'America/Winnipeg';

ALTER TABLE "user_personality"
ALTER COLUMN "created_at" TYPE TIMESTAMP(6)
USING "created_at" AT TIME ZONE 'America/Winnipeg';

ALTER TABLE "user_personality"
ALTER COLUMN "updated_at" TYPE TIMESTAMP(6)
USING "updated_at" AT TIME ZONE 'America/Winnipeg';

ALTER TABLE "personality_type"
ALTER COLUMN "created_at" TYPE TIMESTAMP(6)
USING "created_at" AT TIME ZONE 'America/Winnipeg';

ALTER TABLE "personality_type"
ALTER COLUMN "updated_at" TYPE TIMESTAMP(6)
USING "updated_at" AT TIME ZONE 'America/Winnipeg';
