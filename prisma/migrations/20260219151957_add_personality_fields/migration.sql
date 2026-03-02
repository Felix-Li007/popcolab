-- AlterTable
ALTER TABLE "personality_type" ADD COLUMN     "accent_color" VARCHAR(20),
ADD COLUMN     "emoji" VARCHAR(10),
ADD COLUMN     "stars" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'active';
