ALTER TABLE "experience"
RENAME COLUMN "experience_name" TO "experience_title";

ALTER TABLE "experience"
ALTER COLUMN "experience_title" TYPE VARCHAR(100);

ALTER TABLE "experience"
ADD COLUMN "category_id" INTEGER,
ADD COLUMN "popularity_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "delivery_methods" VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN "dietary_considerations" VARCHAR(255),
ADD COLUMN "take_item" INTEGER,
ADD COLUMN "travel_flying" INTEGER,
ADD COLUMN "created_by" INTEGER NOT NULL DEFAULT 0;

UPDATE "experience" AS e
SET "category_id" = ec."category_id"
FROM (
  SELECT DISTINCT ON ("experience_id") "experience_id", "category_id"
  FROM "experience_category"
  ORDER BY "experience_id", "id"
) AS ec
WHERE e."id" = ec."experience_id"
  AND e."category_id" IS NULL;

ALTER TABLE "experience"
ALTER COLUMN "category_id" SET NOT NULL,
DROP COLUMN "starting_price",
DROP COLUMN "starting_hour",
DROP COLUMN "adding_price";

ALTER TABLE "experience"
ADD CONSTRAINT "experience_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "category"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

DROP TABLE "experience_category";
