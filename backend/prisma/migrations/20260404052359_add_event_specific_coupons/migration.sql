-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "event_id" TEXT;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
