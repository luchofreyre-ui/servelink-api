-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "priceSubtotal" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "priceTotal" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "margin" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrustEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "franchiseOwnerId" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payout" (
    "id" TEXT NOT NULL,
    "franchiseOwnerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrustEvent_bookingId_idx" ON "TrustEvent"("bookingId");
CREATE INDEX IF NOT EXISTS "TrustEvent_franchiseOwnerId_idx" ON "TrustEvent"("franchiseOwnerId");
CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX IF NOT EXISTS "Payout_franchiseOwnerId_idx" ON "Payout"("franchiseOwnerId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustEvent_bookingId_fkey') THEN
    ALTER TABLE "TrustEvent" ADD CONSTRAINT "TrustEvent_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_bookingId_fkey') THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payout_franchiseOwnerId_fkey') THEN
    ALTER TABLE "Payout" ADD CONSTRAINT "Payout_franchiseOwnerId_fkey"
      FOREIGN KEY ("franchiseOwnerId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
