-- Rename the existing Booking table to match the new Prisma mapping.
ALTER TABLE "Booking" RENAME TO "user_event";

-- Keep generated object names aligned with the new table name.
ALTER TABLE "user_event" RENAME CONSTRAINT "Booking_pkey" TO "user_event_pkey";
ALTER TABLE "user_event" RENAME CONSTRAINT "Booking_event_id_fkey" TO "user_event_event_id_fkey";

-- The SERIAL sequence created for the id column keeps its old name after a table rename.
ALTER SEQUENCE "Booking_id_seq" RENAME TO "user_event_id_seq";
