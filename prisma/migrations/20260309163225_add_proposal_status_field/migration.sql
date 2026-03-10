-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "proposal" ADD COLUMN     "proposal_status" "ProposalStatus" NOT NULL DEFAULT 'pending';
