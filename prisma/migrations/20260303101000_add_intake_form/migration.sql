-- CreateTable
CREATE TABLE "intake_form" (
    "id" SERIAL NOT NULL,
    "form_name" VARCHAR(50) NOT NULL,
    "form_desc" VARCHAR(255),
    "form_status" INTEGER NOT NULL,
    "form_type" VARCHAR(20) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intake_form_pkey" PRIMARY KEY ("id")
);

-- CreateIndex

CREATE INDEX "intake_form_created_by_idx" ON "intake_form" ("created_by");

-- CreateTable
CREATE TABLE "form_question" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_question_form_id_question_id_key" ON "form_question" ("form_id", "question_id");

-- CreateIndex
CREATE INDEX "form_question_form_id_idx" ON "form_question" ("form_id");

-- CreateIndex
CREATE INDEX "form_question_question_id_idx" ON "form_question" ("question_id");

-- AddForeignKey
ALTER TABLE "form_question"
ADD CONSTRAINT "form_question_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "intake_form" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_question"
ADD CONSTRAINT "form_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_form"
ADD CONSTRAINT "intake_form_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;