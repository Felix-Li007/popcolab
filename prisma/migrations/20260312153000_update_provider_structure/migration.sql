ALTER TABLE "provider"
RENAME COLUMN "provider_name" TO "provider_label";

ALTER TABLE "provider"
ADD COLUMN "provider_notes" VARCHAR(255),
ADD COLUMN "pricing_notes" VARCHAR(255);
