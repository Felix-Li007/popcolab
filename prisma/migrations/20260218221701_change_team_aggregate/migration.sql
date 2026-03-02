/*
  Warnings:

  - You are about to drop the `Team_Aggregate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Team_Aggregate" DROP CONSTRAINT "Team_Aggregate_team_id_fkey";

-- DropTable
DROP TABLE "Team_Aggregate";

-- CreateTable
CREATE TABLE "team_aggregate" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "average_score" DECIMAL(19,0) NOT NULL,
    "standard_score" DECIMAL(19,0) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "team_aggregate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "team_aggregate" ADD CONSTRAINT "team_aggregate_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
