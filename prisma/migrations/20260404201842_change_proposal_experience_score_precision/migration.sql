/*
  Warnings:

  - You are about to alter the column `base_score` on the `proposal_experience` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,0)` to `Decimal(19,2)`.
  - You are about to alter the column `risk_adjustment` on the `proposal_experience` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,0)` to `Decimal(19,2)`.

*/
-- AlterTable
ALTER TABLE "proposal_experience" ALTER COLUMN "base_score" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "risk_adjustment" SET DATA TYPE DECIMAL(19,2);
