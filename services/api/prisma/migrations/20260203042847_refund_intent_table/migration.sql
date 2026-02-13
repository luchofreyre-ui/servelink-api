-- CreateTable
CREATE TABLE "RefundIntent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountCents" INTEGER,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_execution',
    "idempotencyKey" TEXT NOT NULL,
    "stripeRefundId" TEXT,
    "createdByAdminUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefundIntent_idempotencyKey_key" ON "RefundIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RefundIntent_bookingId_createdAt_idx" ON "RefundIntent"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "RefundIntent_status_createdAt_idx" ON "RefundIntent"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "RefundIntent" ADD CONSTRAINT "RefundIntent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
