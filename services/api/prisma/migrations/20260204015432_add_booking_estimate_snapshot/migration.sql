-- CreateTable
CREATE TABLE "BookingEstimateSnapshot" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "estimatorVersion" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskPercentUncapped" INTEGER NOT NULL,
    "riskPercentCappedForRange" INTEGER NOT NULL,
    "riskCapped" BOOLEAN NOT NULL,
    "inputJson" TEXT NOT NULL,
    "outputJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEstimateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingEstimateSnapshot_bookingId_key" ON "BookingEstimateSnapshot"("bookingId");

-- CreateIndex
CREATE INDEX "BookingEstimateSnapshot_bookingId_idx" ON "BookingEstimateSnapshot"("bookingId");

-- CreateIndex
CREATE INDEX "BookingEstimateSnapshot_createdAt_idx" ON "BookingEstimateSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "BookingEstimateSnapshot" ADD CONSTRAINT "BookingEstimateSnapshot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
