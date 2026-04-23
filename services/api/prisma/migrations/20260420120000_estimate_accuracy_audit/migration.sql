-- Estimate accuracy feedback loop + booking↔direction intake link

CREATE TYPE "EstimateVarianceReasonCode" AS ENUM (
  'home_dirtier_than_intake',
  'clutter_understated',
  'kitchen_underestimated',
  'bathroom_underestimated',
  'pet_impact_underestimated',
  'customer_scope_expanded',
  'estimator_model_miss',
  'intake_missing_signal',
  'other'
);

ALTER TABLE "BookingDirectionIntake" ADD COLUMN "bookingId" TEXT;

CREATE UNIQUE INDEX "BookingDirectionIntake_bookingId_key" ON "BookingDirectionIntake"("bookingId");

ALTER TABLE "BookingDirectionIntake" ADD CONSTRAINT "BookingDirectionIntake_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "EstimateAccuracyAudit" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "estimateInputSnapshot" JSONB NOT NULL,
  "estimateOutputSnapshot" JSONB NOT NULL,
  "actualJobOutcome" JSONB,
  "laborVariancePct" DOUBLE PRECISION,
  "pricingVariancePct" DOUBLE PRECISION,
  "effortVariancePct" DOUBLE PRECISION,
  "varianceReasonCodes" "EstimateVarianceReasonCode"[] DEFAULT ARRAY[]::"EstimateVarianceReasonCode"[],
  "crewFeedbackNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EstimateAccuracyAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EstimateAccuracyAudit_bookingId_key" UNIQUE ("bookingId"),
  CONSTRAINT "EstimateAccuracyAudit_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "EstimateAccuracyAudit_createdAt_idx" ON "EstimateAccuracyAudit"("createdAt");
