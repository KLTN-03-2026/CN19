-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
