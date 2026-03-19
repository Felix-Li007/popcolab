ALTER TABLE "company"
RENAME COLUMN "corporate_name" TO "company_name";

ALTER TABLE "company"
ADD COLUMN "company_size" INTEGER,
ADD COLUMN "company_website" VARCHAR(255);
