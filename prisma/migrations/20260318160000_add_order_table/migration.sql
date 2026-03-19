CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "proposal_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "order_status" VARCHAR(20) NOT NULL,
    "payment_id" INTEGER,
    "expired_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_proposal_id_idx" ON "order"("proposal_id");
CREATE INDEX "order_user_id_idx" ON "order"("user_id");
CREATE INDEX "order_payment_id_idx" ON "order"("payment_id");

ALTER TABLE "order"
ADD CONSTRAINT "order_proposal_id_fkey"
FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "order"
ADD CONSTRAINT "order_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
