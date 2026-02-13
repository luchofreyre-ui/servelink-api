-- CreateTable
CREATE TABLE "BookingStripePayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "clientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingStripePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingStripePayment_bookingId_key" ON "BookingStripePayment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingStripePayment_stripePaymentIntentId_key" ON "BookingStripePayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "BookingStripePayment_bookingId_idx" ON "BookingStripePayment"("bookingId");

-- CreateIndex
CREATE INDEX "BookingStripePayment_status_idx" ON "BookingStripePayment"("status");

-- AddForeignKey
ALTER TABLE "BookingStripePayment" ADD CONSTRAINT "BookingStripePayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
