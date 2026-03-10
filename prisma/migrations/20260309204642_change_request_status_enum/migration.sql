-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('opened', 'pending', 'matched', 'closed');
ALTER TABLE "public"."request" ALTER COLUMN "request_status" DROP DEFAULT;
ALTER TABLE "request" ALTER COLUMN "request_status" TYPE "RequestStatus_new" USING ("request_status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "request" ALTER COLUMN "request_status" SET DEFAULT 'opened';
COMMIT;
