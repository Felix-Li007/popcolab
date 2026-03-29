-- CreateTable
CREATE TABLE "event_gallery" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "image_alt" VARCHAR(50),
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "image_notes" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "event_gallery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
