-- Update RequestStatus enum to uppercase values and add generation workflow states.
ALTER TABLE "request" ALTER COLUMN "request_status" DROP DEFAULT;

ALTER TABLE "request"
ALTER COLUMN "request_status" TYPE text USING ("request_status"::text);

DROP TYPE IF EXISTS "RequestStatus";

CREATE TYPE "RequestStatus" AS ENUM (
  'OPENED',
  'PENDING',
  'MATCHED',
  'CLOSED',
  'PROCESSING',
  'RETRYING'
);

ALTER TABLE "request"
ALTER COLUMN "request_status" TYPE "RequestStatus" USING (
    CASE UPPER("request_status")
        WHEN 'OPENED' THEN 'OPENED'
        WHEN 'PENDING' THEN 'PENDING'
        WHEN 'MATCHED' THEN 'MATCHED'
        WHEN 'CLOSED' THEN 'CLOSED'
        WHEN 'GENERATING_PROPOSAL' THEN 'PROCESSING'
        WHEN 'REGENERATE_PROPOSAL' THEN 'RETRYING'
        WHEN 'PROCING' THEN 'PROCESSING'
        WHEN 'PROCESSING' THEN 'PROCESSING'
        WHEN 'RETRYING' THEN 'RETRYING'
        ELSE 'OPENED'
    END
)::"RequestStatus";

ALTER TABLE "request"
ALTER COLUMN "request_status"
SET DEFAULT 'OPENED';