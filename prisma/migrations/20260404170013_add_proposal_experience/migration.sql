-- CreateTable
CREATE TABLE "proposal_experience" (
    "id" SERIAL NOT NULL,
    "proposal_id" INTEGER NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_experience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposal_experience_experience_id_idx" ON "proposal_experience"("experience_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_experience_proposal_id_experience_id_key" ON "proposal_experience"("proposal_id", "experience_id");

-- AddForeignKey
ALTER TABLE "proposal_experience" ADD CONSTRAINT "proposal_experience_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_experience" ADD CONSTRAINT "proposal_experience_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
