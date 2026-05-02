CREATE TABLE IF NOT EXISTS "RecurringPlanOutcome" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "converted" BOOLEAN NOT NULL,
  "cadence" "RecurringCadence",
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecurringPlanOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecurringPlanOutcome_bookingId_key"
  ON "RecurringPlanOutcome"("bookingId");

CREATE INDEX IF NOT EXISTS "RecurringPlanOutcome_bookingId_idx"
  ON "RecurringPlanOutcome"("bookingId");

CREATE INDEX IF NOT EXISTS "RecurringPlanOutcome_converted_idx"
  ON "RecurringPlanOutcome"("converted");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RecurringPlanOutcome_bookingId_fkey'
  ) THEN
    ALTER TABLE "RecurringPlanOutcome"
      ADD CONSTRAINT "RecurringPlanOutcome_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
