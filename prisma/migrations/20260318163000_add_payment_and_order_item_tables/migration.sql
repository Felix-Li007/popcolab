CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "order_amount" DECIMAL(19,0),
    "gst_rate" INTEGER,
    "pst_rate" INTEGER,
    "hst_rate" INTEGER,
    "grand_total" DECIMAL(19,0),
    "gst_amount" DECIMAL(19,0),
    "hst_amount" DECIMAL(19,0),
    "payment_method" VARCHAR(20) NOT NULL,
    "customer_id" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(50) NOT NULL,
    "payment_status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_item" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "item_price" DECIMAL(19,0) NOT NULL,
    "schedule_date" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_item_order_id_idx" ON "order_item"("order_id");
CREATE INDEX "order_item_experience_id_idx" ON "order_item"("experience_id");

ALTER TABLE "order"
ADD CONSTRAINT "order_payment_id_fkey"
FOREIGN KEY ("payment_id") REFERENCES "payment"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "order_item"
ADD CONSTRAINT "order_item_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "order"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "order_item"
ADD CONSTRAINT "order_item_experience_id_fkey"
FOREIGN KEY ("experience_id") REFERENCES "experience"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
