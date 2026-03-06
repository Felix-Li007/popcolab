/*
  Warnings:

  - Made the column `clerk_id` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "avatar_image" VARCHAR(255),
ALTER COLUMN "clerk_id" SET NOT NULL;
