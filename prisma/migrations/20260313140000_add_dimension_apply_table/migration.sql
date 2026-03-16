-- CreateTable
CREATE TABLE "dimension_apply" (
    "id" SERIAL NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "form_name" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dimension_apply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dimension_apply_dimension_id_idx" ON "dimension_apply"("dimension_id");

-- AddForeignKey
ALTER TABLE "dimension_apply" ADD CONSTRAINT "dimension_apply_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE CASCADE ON UPDATE CASCADE;
