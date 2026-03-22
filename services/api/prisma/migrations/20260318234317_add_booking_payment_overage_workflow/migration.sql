-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('none', 'authorized_initial', 'additional_authorization_required', 'additional_authorization_pending', 'additional_authorization_approved', 'additional_authorization_declined', 'ready_for_capture', 'captured');

-- CreateEnum
CREATE TYPE "BookingPaymentOverageStatus" AS ENUM ('pending_customer_approval', 'approved', 'declined', 'payment_intent_created', 'paid', 'canceled');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentAuthorizedCents" INTEGER,
ADD COLUMN     "paymentCapturedCents" INTEGER,
ADD COLUMN     "paymentShortfallCents" INTEGER,
ADD COLUMN     "paymentStatus" "BookingPaymentStatus" NOT NULL DEFAULT 'none',
ADD COLUMN     "paymentStatusUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BookingPaymentOverageRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "requestedByFoId" TEXT NOT NULL,
    "authorizedBaseCents" INTEGER NOT NULL,
    "projectedFinalCents" INTEGER NOT NULL,
    "requestedAdditionalCents" INTEGER NOT NULL,
    "approvedAdditionalCents" INTEGER,
    "status" "BookingPaymentOverageStatus" NOT NULL,
    "customerApprovedAt" TIMESTAMP(3),
    "customerDeclinedAt" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "stripeClientSecret" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPaymentOverageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingPaymentOverageRequest_stripePaymentIntentId_key" ON "BookingPaymentOverageRequest"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "BookingPaymentOverageRequest_bookingId_status_idx" ON "BookingPaymentOverageRequest"("bookingId", "status");

-- CreateIndex
CREATE INDEX "BookingPaymentOverageRequest_requestedByFoId_status_idx" ON "BookingPaymentOverageRequest"("requestedByFoId", "status");

-- AddForeignKey
ALTER TABLE "BookingPaymentOverageRequest" ADD CONSTRAINT "BookingPaymentOverageRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPaymentOverageRequest" ADD CONSTRAINT "BookingPaymentOverageRequest_requestedByFoId_fkey" FOREIGN KEY ("requestedByFoId") REFERENCES "FranchiseOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
