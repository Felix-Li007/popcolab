CREATE TABLE "experience_pricing" (
    "id" SERIAL NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "adding_price" DECIMAL(19,0) NOT NULL,
    "starting_price" DECIMAL(19,0) NOT NULL,
    "starting_hour" INTEGER,
    "pricing_model" VARCHAR(255),
    "pricing_notes" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_pricing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "experience_pricing_experience_id_key"
ON "experience_pricing"("experience_id");

ALTER TABLE "experience_pricing"
ADD CONSTRAINT "experience_pricing_experience_id_fkey"
FOREIGN KEY ("experience_id") REFERENCES "experience"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
