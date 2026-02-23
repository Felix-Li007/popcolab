-- CreateTable
CREATE TABLE "experience_dimension" (
    "id" SERIAL NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "original_score" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "experience_dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "objective_alignment" VARCHAR(255) NOT NULL,
    "base_score" DECIMAL(19,0) NOT NULL,
    "risk_adjustment" DECIMAL(19,0) NOT NULL,
    "rationale_desc" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_preference" (
    "id" SERIAL NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "request_id" INTEGER NOT NULL,
    "desired_score" DECIMAL(19,0) NOT NULL,
    "weight_rate" DECIMAL(19,0) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "request_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "objective_category" INTEGER,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    "delivery_method" INTEGER,
    "duration_max" INTEGER,

    CONSTRAINT "request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "experience_dimension" ADD CONSTRAINT "experience_dimension_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_dimension" ADD CONSTRAINT "experience_dimension_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_preference" ADD CONSTRAINT "request_preference_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension_index"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_preference" ADD CONSTRAINT "request_preference_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
