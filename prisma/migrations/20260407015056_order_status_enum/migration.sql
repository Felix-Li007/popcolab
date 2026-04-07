-- Create enum type for order status values.
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING_PAYMENT',
  'PROCESSING',
  'PAID',
  'PAYMENT_FAILED',
  'CANCELED'
);

-- Convert existing string values to enum values.
ALTER TABLE "order"
ALTER COLUMN "order_status" TYPE "OrderStatus" USING (
    CASE "order_status"::text
        WHEN 'PENDING_PAYMENT' THEN 'PENDING_PAYMENT'
        WHEN 'PROCESSING' THEN 'PROCESSING'
        WHEN 'PAID' THEN 'PAID'
        WHEN 'PAYMENT_FAILED' THEN 'PAYMENT_FAILED'
        WHEN 'CANCELED' THEN 'CANCELED'
        ELSE "order_status"::text
    END::"OrderStatus"
);
