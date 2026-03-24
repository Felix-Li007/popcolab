-- Backfill the canonical owner column before removing the redundant team_owner column.
UPDATE "team"
SET "created_by" = "team_owner"
WHERE "team_owner" IS NOT NULL;
-- DropForeignKey
ALTER TABLE "team" DROP CONSTRAINT "team_team_owner_fkey";
-- AlterTable
ALTER TABLE "team" DROP COLUMN "team_owner";