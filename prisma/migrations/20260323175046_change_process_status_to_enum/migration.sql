/*
 Warnings:
 
 - Changed the type of `process_status` on the `user_experience` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
 
 */
-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('COMPLETED', 'PROGRESS', 'FEEDBACK');
-- AlterTable
ALTER TABLE "user_experience" DROP COLUMN "process_status",
  ADD COLUMN "process_status" "ProcessStatus" NOT NULL;