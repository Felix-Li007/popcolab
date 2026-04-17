/*
  Warnings:

  - You are about to drop the column `preferred_date` on the `request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "request" DROP COLUMN "preferred_date",
ADD COLUMN     "deadline_date" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "request_calendar" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "preferred_date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "request_calendar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "request_calendar" ADD CONSTRAINT "request_calendar_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
