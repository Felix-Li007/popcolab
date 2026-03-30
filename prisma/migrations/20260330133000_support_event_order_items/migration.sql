DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'OrderItemType'
  ) THEN
    CREATE TYPE "OrderItemType" AS ENUM ('EXPERIENCE', 'EVENT');
  END IF;
END $$;

ALTER TABLE "order_item"
ADD COLUMN "item_type" "OrderItemType" NOT NULL DEFAULT 'EXPERIENCE',
ADD COLUMN "event_id" INTEGER,
ALTER COLUMN "experience_id" DROP NOT NULL;

UPDATE "order_item"
SET "item_type" = 'EXPERIENCE'
WHERE "item_type" IS NULL;

CREATE INDEX "order_item_event_id_idx" ON "order_item"("event_id");

ALTER TABLE "order_item"
ADD CONSTRAINT "order_item_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "event"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "order_item"
ADD CONSTRAINT "order_item_item_type_target_check"
CHECK (
  ("item_type" = 'EXPERIENCE' AND "experience_id" IS NOT NULL AND "event_id" IS NULL)
  OR
  ("item_type" = 'EVENT' AND "event_id" IS NOT NULL AND "experience_id" IS NULL)
);
