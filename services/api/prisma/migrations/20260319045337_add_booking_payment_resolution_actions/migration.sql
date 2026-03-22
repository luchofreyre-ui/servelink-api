-- CreateEnum
CREATE TYPE "BookingPaymentResolutionSource" AS ENUM ('stripe_retry', 'admin_force_capture', 'admin_off_platform');

-- CreateTable
CREATE TABLE "BookingPaymentResolution" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "source" "BookingPaymentResolutionSource" NOT NULL,
    "actorUserId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPaymentResolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingPaymentResolution_bookingId_createdAt_idx" ON "BookingPaymentResolution"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingPaymentResolution_source_createdAt_idx" ON "BookingPaymentResolution"("source", "createdAt");

-- AddForeignKey
ALTER TABLE "BookingPaymentResolution" ADD CONSTRAINT "BookingPaymentResolution_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
