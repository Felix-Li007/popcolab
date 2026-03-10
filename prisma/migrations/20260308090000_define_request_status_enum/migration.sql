-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('open', 'in_review', 'matched', 'closed');

-- AlterTable
ALTER TABLE "request"
ALTER COLUMN "request_status" DROP DEFAULT,
ALTER COLUMN "request_status" TYPE "RequestStatus"
USING ("request_status"::"RequestStatus"),
ALTER COLUMN "request_status" SET DEFAULT 'open'::"RequestStatus";
