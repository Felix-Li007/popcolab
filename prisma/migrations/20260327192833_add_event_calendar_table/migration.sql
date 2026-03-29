-- CreateTable
CREATE TABLE "event_calendar" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "event_date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "event_calendar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_calendar" ADD CONSTRAINT "event_calendar_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
