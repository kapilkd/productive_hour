-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "board_id" UUID;

-- CreateTable
CREATE TABLE "boards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boards_name_key" ON "boards"("name");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
