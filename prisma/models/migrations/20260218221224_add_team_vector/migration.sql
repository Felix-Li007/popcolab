/*
  Warnings:

  - You are about to drop the `Response` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_response_id_fkey";

-- DropForeignKey
ALTER TABLE "response_score" DROP CONSTRAINT "response_score_response_id_fkey";

-- DropForeignKey
ALTER TABLE "user_vector" DROP CONSTRAINT "user_vector_response_id_fkey";

-- DropTable
DROP TABLE "Response";

-- CreateTable
CREATE TABLE "Team_Aggregate" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "average_score" DECIMAL(19,0) NOT NULL,
    "standard_score" DECIMAL(19,0) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "Team_Aggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP,

    CONSTRAINT "response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_vector" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "vector_json" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "team_vector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_vector_team_id_key" ON "team_vector"("team_id");

-- AddForeignKey
ALTER TABLE "Team_Aggregate" ADD CONSTRAINT "Team_Aggregate_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "response"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_score" ADD CONSTRAINT "response_score_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "response"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_vector" ADD CONSTRAINT "team_vector_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vector" ADD CONSTRAINT "user_vector_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "response"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
