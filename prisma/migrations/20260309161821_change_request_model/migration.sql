-- AlterTable
ALTER TABLE "request"
ADD COLUMN "expired_at" TIMESTAMP(6),
ADD COLUMN "invite_code" VARCHAR(6),
ALTER COLUMN "objective_category" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "budget_min" SET DATA TYPE DECIMAL(19,0),
ALTER COLUMN "budget_max" SET DATA TYPE DECIMAL(19,0),
ALTER COLUMN "delivery_method" SET DATA TYPE VARCHAR(20);

-- Backfill existing rows before enforcing NOT NULL constraints.
UPDATE "request"
SET
  "invite_code" = COALESCE("invite_code", RIGHT(LPAD("id"::text, 6, '0'), 6)),
  "objective_category" = COALESCE(NULLIF(TRIM("objective_category"), ''), 'unknown'),
  "delivery_method" = COALESCE(NULLIF(TRIM("delivery_method"), ''), 'unknown'),
  "created_at" = COALESCE("created_at", NOW()),
  "updated_at" = COALESCE("updated_at", NOW());

-- Enforce required columns after backfill.
ALTER TABLE "request"
ALTER COLUMN "invite_code" SET NOT NULL,
ALTER COLUMN "objective_category" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "delivery_method" SET NOT NULL;
