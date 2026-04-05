/*
  Warnings:

  - The `form_name` column on the `question` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `form_name` on the `dimension_apply` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FormName" AS ENUM ('REQUEST', 'MEMBER', 'ASSESS', 'EXPERIENCE');

-- AlterTable
ALTER TABLE "dimension_apply" DROP COLUMN "form_name",
ADD COLUMN     "form_name" "FormName" NOT NULL;

-- AlterTable
ALTER TABLE "question" DROP COLUMN "form_name",
ADD COLUMN     "form_name" "FormName" NOT NULL DEFAULT 'REQUEST';

-- DropEnum
DROP TYPE "IntakeForm";
