-- CreateTable
CREATE TABLE "DisputeCase" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisputeCase_stripeDisputeId_key" ON "DisputeCase"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "DisputeCase_bookingId_createdAt_idx" ON "DisputeCase"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "DisputeCase_status_updatedAt_idx" ON "DisputeCase"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
