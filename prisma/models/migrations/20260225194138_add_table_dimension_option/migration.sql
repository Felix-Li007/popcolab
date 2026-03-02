-- CreateTable
CREATE TABLE "dimension_option" (
    "id" SERIAL NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "allowed_value" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "dimension_option_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dimension_option" ADD CONSTRAINT "dimension_option_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
