-- AlterTable
ALTER TABLE "form_dimension" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "form_question" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "intake_form" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "contact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);
