/*
  Warnings:

  - The values [pending,accepted,rejected] on the enum `ProposalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProposalStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "public"."proposal" ALTER COLUMN "proposal_status" DROP DEFAULT;
ALTER TABLE "proposal" ALTER COLUMN "proposal_status" TYPE "ProposalStatus_new" USING ("proposal_status"::text::"ProposalStatus_new");
ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";
ALTER TYPE "ProposalStatus_new" RENAME TO "ProposalStatus";
DROP TYPE "public"."ProposalStatus_old";
ALTER TABLE "proposal" ALTER COLUMN "proposal_status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "proposal" ALTER COLUMN "proposal_status" SET DEFAULT 'PENDING';
