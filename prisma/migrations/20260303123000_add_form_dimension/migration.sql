-- CreateTable
CREATE TABLE "form_dimension" (
    "id" SERIAL NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "form_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_dimension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_dimension_form_id_dimension_id_key" ON "form_dimension"("form_id", "dimension_id");

-- CreateIndex
CREATE INDEX "form_dimension_form_id_idx" ON "form_dimension"("form_id");

-- CreateIndex
CREATE INDEX "form_dimension_dimension_id_idx" ON "form_dimension"("dimension_id");

-- AddForeignKey
ALTER TABLE "form_dimension" ADD CONSTRAINT "form_dimension_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "intake_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_dimension" ADD CONSTRAINT "form_dimension_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE CASCADE ON UPDATE CASCADE;
