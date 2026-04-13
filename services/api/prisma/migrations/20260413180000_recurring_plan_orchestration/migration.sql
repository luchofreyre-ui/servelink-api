-- CreateEnum
CREATE TYPE "RecurringPlanStatus" AS ENUM ('active', 'paused', 'canceled');

-- CreateEnum
CREATE TYPE "RecurringCadence" AS ENUM ('weekly', 'biweekly', 'monthly');

-- CreateEnum
CREATE TYPE "RecurringOccurrenceStatus" AS ENUM (
  'pending_generation',
  'booking_created',
  'scheduled',
  'completed',
  'skipped',
  'canceled',
  'needs_review'
);

-- CreateTable
CREATE TABLE "RecurringPlan" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "RecurringPlanStatus" NOT NULL DEFAULT 'active',
    "cadence" "RecurringCadence" NOT NULL,
    "serviceType" TEXT NOT NULL,
    "preferredTimeWindow" TEXT,
    "preferredFoId" TEXT,
    "bookingNotes" TEXT,
    "estimateSnapshot" JSONB NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "intakeSnapshot" JSONB NOT NULL,
    "defaultAddonIds" JSONB NOT NULL,
    "addressSnapshot" JSONB NOT NULL,
    "createdFromBookingId" TEXT,
    "nextAnchorAt" TIMESTAMP(3) NOT NULL,
    "lastGeneratedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringOccurrence" (
    "id" TEXT NOT NULL,
    "recurringPlanId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "RecurringOccurrenceStatus" NOT NULL DEFAULT 'pending_generation',
    "bookingId" TEXT,
    "overrideAddonIds" JSONB,
    "overrideInstructions" TEXT,
    "overridePreferredFoId" TEXT,
    "bookingSnapshot" JSONB,
    "generationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringPlan_customerId_status_idx" ON "RecurringPlan"("customerId", "status");

-- CreateIndex
CREATE INDEX "RecurringPlan_nextAnchorAt_status_idx" ON "RecurringPlan"("nextAnchorAt", "status");

-- CreateIndex
CREATE INDEX "RecurringOccurrence_recurringPlanId_status_idx" ON "RecurringOccurrence"("recurringPlanId", "status");

-- CreateIndex
CREATE INDEX "RecurringOccurrence_targetDate_status_idx" ON "RecurringOccurrence"("targetDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringOccurrence_recurringPlanId_sequenceNumber_key" ON "RecurringOccurrence"("recurringPlanId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "RecurringPlan" ADD CONSTRAINT "RecurringPlan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringOccurrence" ADD CONSTRAINT "RecurringOccurrence_recurringPlanId_fkey" FOREIGN KEY ("recurringPlanId") REFERENCES "RecurringPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
