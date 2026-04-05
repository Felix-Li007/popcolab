-- Add columns as nullable first so we can backfill existing data safely.
ALTER TABLE "proposal_experience"
ADD COLUMN "base_score" DECIMAL(19, 0),
ADD COLUMN "rationale_desc" VARCHAR(255),
ADD COLUMN "risk_adjustment" DECIMAL(19, 0);

-- Ensure every proposal has at least one proposal_experience row for its primary experience.
INSERT INTO
    "proposal_experience" (
        "proposal_id",
        "experience_id",
        "base_score",
        "risk_adjustment",
        "rationale_desc",
        "created_at"
    )
SELECT p."id", p."experience_id", p."base_score", p."risk_adjustment", p."rationale_desc", p."created_at"
FROM
    "proposal" p
    LEFT JOIN "proposal_experience" pe ON pe."proposal_id" = p."id"
    AND pe."experience_id" = p."experience_id"
WHERE
    pe."id" IS NULL;

-- Backfill existing proposal_experience rows from proposal-level values.
UPDATE "proposal_experience" pe
SET
    "base_score" = p."base_score",
    "risk_adjustment" = p."risk_adjustment",
    "rationale_desc" = p."rationale_desc"
FROM "proposal" p
WHERE
    p."id" = pe."proposal_id"
    AND (
        pe."base_score" IS NULL
        OR pe."risk_adjustment" IS NULL
        OR pe."rationale_desc" IS NULL
    );

-- Enforce required columns after backfill.
ALTER TABLE "proposal_experience"
ALTER COLUMN "base_score"
SET NOT NULL,
ALTER COLUMN "risk_adjustment"
SET NOT NULL,
ALTER COLUMN "rationale_desc"
SET NOT NULL;

-- Drop legacy proposal-level fields.
ALTER TABLE "proposal"
DROP COLUMN "base_score",
DROP COLUMN "rationale_desc",
DROP COLUMN "risk_adjustment";