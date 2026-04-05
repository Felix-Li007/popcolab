-- CreateTable
CREATE TABLE "user_personality" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "dimension_id" INTEGER,
    "option_id" INTEGER,
    "desired_value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_personality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preference" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "dimension_id" INTEGER,
    "option_id" INTEGER,
    "desired_value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_personality_user_id_idx" ON "user_personality"("user_id");

-- CreateIndex
CREATE INDEX "user_personality_dimension_id_idx" ON "user_personality"("dimension_id");

-- CreateIndex
CREATE INDEX "user_preference_user_id_idx" ON "user_preference"("user_id");

-- CreateIndex
CREATE INDEX "user_preference_dimension_id_idx" ON "user_preference"("dimension_id");

-- AddForeignKey
ALTER TABLE "user_personality" ADD CONSTRAINT "user_personality_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_personality" ADD CONSTRAINT "user_personality_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_personality" ADD CONSTRAINT "user_personality_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_personality" ADD CONSTRAINT "user_personality_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
