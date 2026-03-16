ALTER TABLE "dimension_apply"
ALTER COLUMN "form_name" TYPE "IntakeName"
USING ("form_name"::text::"IntakeName");
