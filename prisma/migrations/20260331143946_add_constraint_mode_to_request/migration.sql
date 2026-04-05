-- CreateEnum
CREATE TYPE "ConstraintMode" AS ENUM ('SOFT', 'HARD');

-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_event_id_fkey";

-- DropForeignKey
ALTER TABLE "order_item"
DROP CONSTRAINT "order_item_experience_id_fkey";

-- AlterTable
ALTER TABLE "event" ALTER COLUMN "contentHtml" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "notification" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "request"
ADD COLUMN "constraint_mode" "ConstraintMode" NOT NULL DEFAULT 'SOFT';

-- AddForeignKey
ALTER TABLE "order_item"
ADD CONSTRAINT "order_item_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item"
ADD CONSTRAINT "order_item_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE SET NULL ON UPDATE CASCADE;