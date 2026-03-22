-- CreateEnum
CREATE TYPE "FranchiseOwnerScheduleOverrideMode" AS ENUM ('available', 'unavailable');

-- CreateEnum
CREATE TYPE "FranchiseOwnerBodyCamRequirementMode" AS ENUM ('optional', 'required');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "requiredTeamSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requiresBodyCam" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ConversionIncident" ADD COLUMN     "severityScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "FranchiseOwnerWeeklyAvailability" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "startMinuteOfDay" INTEGER NOT NULL,
    "endMinuteOfDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerWeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseOwnerAvailabilityBlackout" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerAvailabilityBlackout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseOwnerAvailabilityOverride" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "mode" "FranchiseOwnerScheduleOverrideMode" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerAvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseOwnerSchedulingSettings" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "maxHoursPerDay" DECIMAL(6,2),
    "bufferMinutesBetweenJobs" INTEGER NOT NULL DEFAULT 0,
    "maxConcurrentJobs" INTEGER NOT NULL DEFAULT 1,
    "baseTeamSize" INTEGER NOT NULL DEFAULT 1,
    "bodyCamRequirementMode" "FranchiseOwnerBodyCamRequirementMode" NOT NULL DEFAULT 'optional',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerSchedulingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseOwnerBodyCamAssignment" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "assignmentDate" TIMESTAMP(3) NOT NULL,
    "bodyCamLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerBodyCamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FranchiseOwnerWeeklyAvailability_foId_dayOfWeek_idx" ON "FranchiseOwnerWeeklyAvailability"("foId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwnerWeeklyAvailability_foId_dayOfWeek_key" ON "FranchiseOwnerWeeklyAvailability"("foId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "FranchiseOwnerAvailabilityBlackout_foId_startAt_endAt_idx" ON "FranchiseOwnerAvailabilityBlackout"("foId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "FranchiseOwnerAvailabilityOverride_foId_startAt_endAt_mode_idx" ON "FranchiseOwnerAvailabilityOverride"("foId", "startAt", "endAt", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwnerSchedulingSettings_foId_key" ON "FranchiseOwnerSchedulingSettings"("foId");

-- CreateIndex
CREATE INDEX "FranchiseOwnerBodyCamAssignment_foId_assignmentDate_idx" ON "FranchiseOwnerBodyCamAssignment"("foId", "assignmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwnerBodyCamAssignment_foId_assignmentDate_bodyCam_key" ON "FranchiseOwnerBodyCamAssignment"("foId", "assignmentDate", "bodyCamLabel");

-- AddForeignKey
ALTER TABLE "FranchiseOwnerWeeklyAvailability" ADD CONSTRAINT "FranchiseOwnerWeeklyAvailability_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseOwnerAvailabilityBlackout" ADD CONSTRAINT "FranchiseOwnerAvailabilityBlackout_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseOwnerAvailabilityOverride" ADD CONSTRAINT "FranchiseOwnerAvailabilityOverride_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseOwnerSchedulingSettings" ADD CONSTRAINT "FranchiseOwnerSchedulingSettings_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseOwnerBodyCamAssignment" ADD CONSTRAINT "FranchiseOwnerBodyCamAssignment_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
