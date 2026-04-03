/*
  Warnings:

  - You are about to drop the column `category` on the `Merchandise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Merchandise" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "address_raw" TEXT,
ADD COLUMN     "back_image_url" TEXT,
ADD COLUMN     "dob_raw" TEXT,
ADD COLUMN     "face_image_url" TEXT,
ADD COLUMN     "facematch_score" DOUBLE PRECISION,
ADD COLUMN     "front_image_url" TEXT,
ADD COLUMN     "full_name_raw" TEXT,
ADD COLUMN     "id_number" TEXT,
ADD COLUMN     "kyc_raw_data" JSONB,
ADD COLUMN     "liveness_score" DOUBLE PRECISION;
