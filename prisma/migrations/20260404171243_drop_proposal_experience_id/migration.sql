/*
  Warnings:

  - You are about to drop the column `experience_id` on the `proposal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "proposal" DROP CONSTRAINT "proposal_experience_id_fkey";

-- AlterTable
ALTER TABLE "proposal" DROP COLUMN "experience_id";
