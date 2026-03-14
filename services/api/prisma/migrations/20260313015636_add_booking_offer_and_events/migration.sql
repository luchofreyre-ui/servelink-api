-- CreateEnum
CREATE TYPE "BookingOfferStatus" AS ENUM ('offered', 'accepted', 'rejected', 'expired', 'canceled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingEventType" ADD VALUE 'DISPATCH_STARTED';
ALTER TYPE "BookingEventType" ADD VALUE 'OFFER_CREATED';
ALTER TYPE "BookingEventType" ADD VALUE 'OFFER_ACCEPTED';
ALTER TYPE "BookingEventType" ADD VALUE 'OFFER_REJECTED';
ALTER TYPE "BookingEventType" ADD VALUE 'OFFER_EXPIRED';
ALTER TYPE "BookingEventType" ADD VALUE 'DISPATCH_EXHAUSTED';

-- CreateTable
CREATE TABLE "BookingOffer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "status" "BookingOfferStatus" NOT NULL DEFAULT 'offered',
    "rank" INTEGER NOT NULL,
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "responseNote" TEXT,
    "dispatchRound" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingOffer_bookingId_createdAt_idx" ON "BookingOffer"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingOffer_bookingId_status_createdAt_idx" ON "BookingOffer"("bookingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BookingOffer_foId_status_createdAt_idx" ON "BookingOffer"("foId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BookingOffer_status_expiresAt_idx" ON "BookingOffer"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "BookingOffer_bookingId_dispatchRound_rank_idx" ON "BookingOffer"("bookingId", "dispatchRound", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "BookingOffer_bookingId_foId_dispatchRound_key" ON "BookingOffer"("bookingId", "foId", "dispatchRound");

-- CreateIndex
CREATE INDEX "Booking_status_scheduledStart_idx" ON "Booking"("status", "scheduledStart");

-- AddForeignKey
ALTER TABLE "BookingOffer" ADD CONSTRAINT "BookingOffer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingOffer" ADD CONSTRAINT "BookingOffer_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
