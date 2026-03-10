-- CreateTable
CREATE TABLE "experience_calendar" (
    "id" SERIAL NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "schedule_date" TIMESTAMP(6) NOT NULL,
    "calendar_status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "experience_calendar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "experience_calendar" ADD CONSTRAINT "experience_calendar_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
