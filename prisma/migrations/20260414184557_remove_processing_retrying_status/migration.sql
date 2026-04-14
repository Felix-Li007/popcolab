/*
  Warnings:

  - The values [PROCESSING,RETRYING] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'REQUEST_INVITATION';

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('OPENED', 'PENDING', 'MATCHED', 'CLOSED');
ALTER TABLE "public"."request" ALTER COLUMN "request_status" DROP DEFAULT;
ALTER TABLE "request" ALTER COLUMN "request_status" TYPE "RequestStatus_new" USING ("request_status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "request" ALTER COLUMN "request_status" SET DEFAULT 'OPENED';
COMMIT;
