/*
  Warnings:

  - You are about to drop the `Play_Personality` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Play_Personality";

-- CreateTable
CREATE TABLE "Personality_Type" (
    "id" SERIAL NOT NULL,
    "personality_key" VARCHAR(50) NOT NULL,
    "personality_name" VARCHAR(50) NOT NULL,
    "personality_desc" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "Personality_Type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personality_Type_personality_key_key" ON "Personality_Type"("personality_key");
