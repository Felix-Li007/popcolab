-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "question_type" VARCHAR(20) NOT NULL,
    "question_text" VARCHAR(255) NOT NULL,
    "question_desc" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "order_index" INTEGER,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_dimension" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "weight_rate" DECIMAL(19,0),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "question_dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_option" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_label" VARCHAR(255) NOT NULL,
    "option_value" VARCHAR(255) NOT NULL,
    "option_score" DECIMAL(19,0),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "question_option_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "question_dimension" ADD CONSTRAINT "question_dimension_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_option" ADD CONSTRAINT "question_option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
