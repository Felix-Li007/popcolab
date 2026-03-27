/*
  Warnings:

  - A unique constraint covering the columns `[order_id,experience_id,schedule_date]` on the table `user_experience` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_id` to the `user_experience` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_experience" DROP CONSTRAINT "user_experience_proposal_id_fkey";

-- AlterTable
ALTER TABLE "request" ADD COLUMN     "notes_for_admin" TEXT,
ADD COLUMN     "participant_count" INTEGER,
ADD COLUMN     "preferred_date" TIMESTAMP(6),
ALTER COLUMN "objective_category" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "user_experience" ADD COLUMN     "order_id" INTEGER NOT NULL,
ALTER COLUMN "proposal_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_preference" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_score" JSONB NOT NULL,
    "provider_score" JSONB NOT NULL,
    "duration_range" JSONB NOT NULL,
    "dimension_weight" JSONB NOT NULL,
    "vector_embed" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "source_window" INTEGER NOT NULL,

    CONSTRAINT "user_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_preference_user_id_source_window_idx" ON "user_preference"("user_id", "source_window");

-- CreateIndex
CREATE INDEX "user_experience_order_id_idx" ON "user_experience"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_experience_order_id_experience_id_schedule_date_key" ON "user_experience"("order_id", "experience_id", "schedule_date");

-- AddForeignKey
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
