CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "message_title" VARCHAR(255) NOT NULL,
    "message_body" VARCHAR(500) NOT NULL,
    "message_data" JSONB,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_user_id_read_at_idx" ON "notification"("user_id", "read_at");
CREATE INDEX "notification_notification_type_idx" ON "notification"("notification_type");

ALTER TABLE "notification"
ADD CONSTRAINT "notification_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
