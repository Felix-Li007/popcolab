-- Align request_preference with current Prisma model.
ALTER TABLE "request_preference"
DROP CONSTRAINT "request_preference_dimension_id_fkey";

ALTER TABLE "request_preference"
RENAME COLUMN "desired_score" TO "desired_value";

ALTER TABLE "request_preference"
ALTER COLUMN "desired_value" TYPE TEXT USING "desired_value"::TEXT,
ALTER COLUMN "dimension_id"
DROP NOT NULL,
ALTER COLUMN "weight_rate"
SET DEFAULT 0.00;

ALTER TABLE "request_preference"
ADD COLUMN "option_id" INTEGER,
ADD COLUMN "question_id" INTEGER;

-- Backfill question_id from REQUEST-form questions that share the same dimension.
UPDATE "request_preference" AS rp
SET
    "question_id" = q."id"
FROM (
        SELECT DISTINCT
            ON ("dimension_id") "dimension_id", "id"
        FROM "question"
        WHERE
            "dimension_id" IS NOT NULL
            AND "form_name" = 'REQUEST'
        ORDER BY
            "dimension_id", "order_index" ASC NULLS LAST, "id" ASC
    ) AS q
WHERE
    rp."question_id" IS NULL
    AND rp."dimension_id" = q."dimension_id";

-- Fallback to the first REQUEST question if any rows still have null question_id.
UPDATE "request_preference"
SET
    "question_id" = (
        SELECT q."id"
        FROM "question" AS q
        WHERE
            q."form_name" = 'REQUEST'
        ORDER BY q."order_index" ASC NULLS LAST, q."id" ASC
        LIMIT 1
    )
WHERE
    "question_id" IS NULL;

ALTER TABLE "request_preference"
ALTER COLUMN "question_id"
SET NOT NULL;

ALTER TABLE "request_preference"
ADD CONSTRAINT "request_preference_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "request_preference"
ADD CONSTRAINT "request_preference_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "dimension_option" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "request_preference"
ADD CONSTRAINT "request_preference_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;