WITH ranked_slots AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY experience_id, schedule_date
            ORDER BY
                CASE
                    WHEN calendar_status::text = 'blocked' THEN 0
                    ELSE 1
                END,
                updated_at DESC,
                id DESC
        ) AS row_num
    FROM "experience_calendar"
)
DELETE FROM "experience_calendar" AS ec
USING ranked_slots
WHERE ec.id = ranked_slots.id
  AND ranked_slots.row_num > 1;

ALTER TABLE "experience_calendar"
ADD CONSTRAINT "experience_calendar_experience_id_schedule_date_key"
UNIQUE ("experience_id", "schedule_date");
