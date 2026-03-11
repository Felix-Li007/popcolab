ALTER TABLE "dimension_option"
RENAME COLUMN "allowed_value" TO "option_value";

ALTER TABLE "dimension_option"
ALTER COLUMN "option_value" TYPE VARCHAR(50);

ALTER TABLE "dimension_option"
ADD COLUMN "option_label" VARCHAR(50);

UPDATE "dimension_option"
SET "option_label" = "option_value"
WHERE "option_label" IS NULL;

ALTER TABLE "dimension_option"
ALTER COLUMN "option_label" SET NOT NULL;
