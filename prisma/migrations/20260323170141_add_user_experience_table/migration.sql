/*
  Warnings:

  - You are about to drop the `form_dimension` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `form_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `intake_form` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TeamInviteStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "form_dimension" DROP CONSTRAINT "form_dimension_dimension_id_fkey";

-- DropForeignKey
ALTER TABLE "form_dimension" DROP CONSTRAINT "form_dimension_form_id_fkey";

-- DropForeignKey
ALTER TABLE "form_question" DROP CONSTRAINT "form_question_form_id_fkey";

-- DropForeignKey
ALTER TABLE "form_question" DROP CONSTRAINT "form_question_question_id_fkey";

-- DropForeignKey
ALTER TABLE "intake_form" DROP CONSTRAINT "intake_form_created_by_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_proposal_id_fkey";

-- DropForeignKey
ALTER TABLE "question_dimension" DROP CONSTRAINT "question_dimension_question_id_fkey";

-- AlterTable
ALTER TABLE "dimension_apply" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "experience" ALTER COLUMN "popularity_index" DROP DEFAULT,
ALTER COLUMN "delivery_methods" DROP DEFAULT,
ALTER COLUMN "created_by" DROP DEFAULT;

-- AlterTable
ALTER TABLE "experience_pricing" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_item" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "pronouns" VARCHAR(50);

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "team_department" VARCHAR(100);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "intake_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "personality_complete" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "form_dimension";

-- DropTable
DROP TABLE "form_question";

-- DropTable
DROP TABLE "intake_form";

-- CreateTable
CREATE TABLE "team_invite" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "invited_by" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50),
    "token" VARCHAR(255) NOT NULL,
    "status" "TeamInviteStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_experience" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "proposal_id" INTEGER NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "schedule_date" TIMESTAMP(6) NOT NULL,
    "complete_date" TIMESTAMP(6),
    "process_status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_experience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_invite_token_key" ON "team_invite"("token");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
