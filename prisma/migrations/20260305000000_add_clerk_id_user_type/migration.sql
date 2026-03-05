-- AlterTable: add clerk_id for Clerk integration
ALTER TABLE "user"
ADD COLUMN "clerk_id" VARCHAR(255);

ALTER TABLE "user"
ADD CONSTRAINT "user_clerk_id_key" UNIQUE ("clerk_id");

-- AlterTable: add user_type with default INDIVIDUAL
ALTER TABLE "user"
ADD COLUMN "user_type" VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL';
