-- CreateTable
CREATE TABLE "BookingBillingFinalization" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "totalBillableMin" INTEGER NOT NULL,
    "totalBillableCents" INTEGER NOT NULL,
    "minimumCents" INTEGER NOT NULL DEFAULT 10000,
    "finalBillableCents" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingBillingFinalization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingBillingFinalization_bookingId_key" ON "BookingBillingFinalization"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingBillingFinalization_idempotencyKey_key" ON "BookingBillingFinalization"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingBillingFinalization_createdAt_idx" ON "BookingBillingFinalization"("createdAt");

-- AddForeignKey
ALTER TABLE "BookingBillingFinalization" ADD CONSTRAINT "BookingBillingFinalization_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
