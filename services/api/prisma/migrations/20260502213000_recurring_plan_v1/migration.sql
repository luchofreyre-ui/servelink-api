ALTER TYPE "RecurringPlanStatus" ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "franchiseOwnerId" TEXT;
ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "pricePerVisitCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RecurringPlan" ADD COLUMN IF NOT EXISTS "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "RecurringPlan" ALTER COLUMN "serviceType" SET DEFAULT 'cleaning';
ALTER TABLE "RecurringPlan" ALTER COLUMN "estimateSnapshot" SET DEFAULT '{}';
ALTER TABLE "RecurringPlan" ALTER COLUMN "pricingSnapshot" SET DEFAULT '{}';
ALTER TABLE "RecurringPlan" ALTER COLUMN "intakeSnapshot" SET DEFAULT '{}';
ALTER TABLE "RecurringPlan" ALTER COLUMN "defaultAddonIds" SET DEFAULT '[]';
ALTER TABLE "RecurringPlan" ALTER COLUMN "addressSnapshot" SET DEFAULT '{}';
ALTER TABLE "RecurringPlan" ALTER COLUMN "nextAnchorAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "RecurringPlan_bookingId_idx" ON "RecurringPlan"("bookingId");
CREATE INDEX IF NOT EXISTS "RecurringPlan_customerId_idx" ON "RecurringPlan"("customerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RecurringPlan_bookingId_fkey'
  ) THEN
    ALTER TABLE "RecurringPlan"
      ADD CONSTRAINT "RecurringPlan_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
