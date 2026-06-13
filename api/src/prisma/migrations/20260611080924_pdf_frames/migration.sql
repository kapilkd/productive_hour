-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('idle', 'processing', 'done', 'failed');

-- CreateEnum
CREATE TYPE "LayoutType" AS ENUM ('title', 'concept', 'definition', 'image_focus', 'split', 'table_layout', 'quote', 'summary');

-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "processing_error" TEXT,
ADD COLUMN     "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'idle',
ADD COLUMN     "source_pdf_url" TEXT;

-- AlterTable
ALTER TABLE "frames" ADD COLUMN     "content_blocks" JSONB,
ADD COLUMN     "extracted_images" JSONB,
ADD COLUMN     "frame_title" TEXT,
ADD COLUMN     "layout_type" "LayoutType" NOT NULL DEFAULT 'concept';
