-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "lastInsideAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "outsideSinceAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BillingSession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "lastInsideAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outsideSinceAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "billableMin" INTEGER,
    "billableCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingSession_bookingId_foId_idx" ON "BillingSession"("bookingId", "foId");

-- CreateIndex
CREATE INDEX "BillingSession_bookingId_startedAt_idx" ON "BillingSession"("bookingId", "startedAt");

-- AddForeignKey
ALTER TABLE "BillingSession" ADD CONSTRAINT "BillingSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
