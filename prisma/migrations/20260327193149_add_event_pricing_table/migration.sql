-- CreateEnum
CREATE TYPE "PriceLevel" AS ENUM ('ADULT', 'SENIOR', 'YOUTH', 'CHILD');

-- CreateTable
CREATE TABLE "event_pricing" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "price_level" "PriceLevel" NOT NULL,
    "event_price" DECIMAL(19,0) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "event_pricing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_pricing" ADD CONSTRAINT "event_pricing_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
