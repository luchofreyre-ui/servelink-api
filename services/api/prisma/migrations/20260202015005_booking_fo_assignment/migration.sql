-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "foId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_foId_idx" ON "Booking"("foId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
