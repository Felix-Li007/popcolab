-- CreateEnum
CREATE TYPE "QuestionFormName" AS ENUM ('REQUEST', 'USER');

-- AlterTable
ALTER TABLE "question"
ADD COLUMN "dimension_id" INTEGER,
ADD COLUMN "form_name" "QuestionFormName" NOT NULL DEFAULT 'REQUEST';

-- CreateIndex
CREATE INDEX "question_dimension_id_idx" ON "question"("dimension_id");

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE SET NULL ON UPDATE CASCADE;
