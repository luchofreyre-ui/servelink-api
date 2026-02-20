-- AlterTable
ALTER TABLE "BookingStripePayment" ADD COLUMN "stripeChargeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BookingStripePayment_stripeChargeId_key" ON "BookingStripePayment"("stripeChargeId");
