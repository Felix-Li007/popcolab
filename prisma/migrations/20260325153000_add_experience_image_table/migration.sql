-- CreateTable
CREATE TABLE "experience_image" (
    "id" SERIAL NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "image_alt" VARCHAR(50),
    "image_notes" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "experience_image_pkey" PRIMARY KEY ("id")
);
-- AddForeignKey
ALTER TABLE "experience_image"
ADD CONSTRAINT "experience_image_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;