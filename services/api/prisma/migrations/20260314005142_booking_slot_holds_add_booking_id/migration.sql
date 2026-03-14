/*
  Warnings:

  - Added the required column `bookingId` to the `BookingSlotHold` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BookingSlotHold" ADD COLUMN     "bookingId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BookingSlotHold_bookingId_idx" ON "BookingSlotHold"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingSlotHold" ADD CONSTRAINT "BookingSlotHold_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
