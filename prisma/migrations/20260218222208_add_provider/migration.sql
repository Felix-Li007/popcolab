-- CreateTable
CREATE TABLE "provider" (
    "id" SERIAL NOT NULL,
    "provider_name" VARCHAR(50) NOT NULL,
    "provider_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "provider_pkey" PRIMARY KEY ("id")
);
