-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "resale_price_limit_percent" DECIMAL(65,30) NOT NULL DEFAULT 108.0,
ALTER COLUMN "royalty_fee_percent" SET DEFAULT 3.0;
