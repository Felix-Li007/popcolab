ALTER TABLE "experience_dimension"
RENAME COLUMN "original_score" TO "expected_value";

ALTER TABLE "experience_dimension"
ALTER COLUMN "expected_value" TYPE VARCHAR(255)
USING CASE
  WHEN "expected_value" IS NULL THEN NULL
  ELSE "expected_value"::TEXT
END;
