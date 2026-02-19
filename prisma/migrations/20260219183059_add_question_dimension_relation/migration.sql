-- AddForeignKey
ALTER TABLE "question_dimension" ADD CONSTRAINT "question_dimension_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
