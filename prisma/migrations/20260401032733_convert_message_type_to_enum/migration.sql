/*
  Warnings:

  - Changed the type of `message_type` on the `notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('EVENT_CANCELED', 'DATE_CANCELED');

-- AlterTable
ALTER TABLE "notification" DROP COLUMN "message_type",
ADD COLUMN     "message_type" "MessageType" NOT NULL;

-- DropEnum
DROP TYPE "message_type_enum";

-- CreateIndex
CREATE INDEX "notification_message_type_idx" ON "notification"("message_type");
