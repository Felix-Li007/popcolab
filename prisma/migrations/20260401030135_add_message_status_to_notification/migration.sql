-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ');

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "message_status" "MessageStatus" NOT NULL DEFAULT 'UNREAD';
