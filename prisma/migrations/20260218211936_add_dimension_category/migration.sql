-- CreateTable
CREATE TABLE "dimension_category" (
    "id" SERIAL NOT NULL,
    "category_name" VARCHAR(50) NOT NULL,
    "category_desc" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "dimension_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dimension_index" (
    "id" SERIAL NOT NULL,
    "index_key" VARCHAR(50),
    "category_id" INTEGER NOT NULL,
    "index_name" VARCHAR(50) NOT NULL,
    "data_type" VARCHAR(20) NOT NULL,
    "hard_filter" BOOLEAN NOT NULL,
    "scale_min" INTEGER,
    "scale_max" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "dimension_index_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dimension_index" ADD CONSTRAINT "dimension_index_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "dimension_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
