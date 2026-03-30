-- Preserve the existing timestamp split before changing schedule_date to a date-only column.
ALTER TABLE "order_item" ADD COLUMN "start_time" TIME;

ALTER TABLE "order_item" ADD COLUMN "end_time" TIME;

UPDATE "order_item"
SET
    "start_time" = "schedule_date"::time,
    "end_time" = "schedule_date"::time;

ALTER TABLE "order_item"
ALTER COLUMN "schedule_date" TYPE DATE USING "schedule_date"::date;

ALTER TABLE "order_item" ALTER COLUMN "start_time" SET NOT NULL;

ALTER TABLE "order_item" ALTER COLUMN "end_time" SET NOT NULL;