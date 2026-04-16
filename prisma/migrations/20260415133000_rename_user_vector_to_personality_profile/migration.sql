ALTER TABLE "user_vector" RENAME TO "personality_profile";

ALTER INDEX "user_vector_pkey" RENAME TO "personality_profile_pkey";
ALTER INDEX "user_vector_user_id_key" RENAME TO "personality_profile_user_id_key";

ALTER TABLE "personality_profile"
RENAME CONSTRAINT "user_vector_response_id_fkey" TO "personality_profile_response_id_fkey";

ALTER TABLE "personality_profile"
RENAME CONSTRAINT "user_vector_user_id_fkey" TO "personality_profile_user_id_fkey";
