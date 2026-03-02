/*
  Warnings:

  - You are about to drop the column `team_code` on the `team` table. All the data in the column will be lost.
  - You are about to alter the column `team_notes` on the `team` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(200)`.
  - Added the required column `team_owner` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "team" DROP COLUMN "team_code",
ADD COLUMN     "team_owner" INTEGER NOT NULL,
ALTER COLUMN "team_notes" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "user_name" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_team_owner_fkey" FOREIGN KEY ("team_owner") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
