-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'DRAFT');

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "eventTitle" VARCHAR(255) NOT NULL,
    "eventLocation" VARCHAR(255) NOT NULL,
    "eventNotes" VARCHAR(255),
    "contentHtml" VARCHAR(255),
    "eventStatus" "EventStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);
