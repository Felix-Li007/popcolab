-- CreateTable
CREATE TABLE "experience" (
    "id" SERIAL NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "experience_name" VARCHAR(50) NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "duration_max" INTEGER NOT NULL,
    "capacity_max" INTEGER NOT NULL,
    "starting_price" DECIMAL(19,0) NOT NULL,
    "starting_hour" INTEGER NOT NULL,
    "adding_price" DECIMAL(19,0) NOT NULL,
    "lead_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "experience_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
