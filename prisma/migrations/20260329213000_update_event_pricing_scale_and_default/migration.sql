-- AlterTable
ALTER TABLE "event_pricing"
ALTER COLUMN "event_price" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "event_price" SET DEFAULT 0.00;
