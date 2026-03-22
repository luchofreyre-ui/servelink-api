-- CreateEnum
CREATE TYPE "DispatchConfigStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateTable
CREATE TABLE "DispatchConfig" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DispatchConfigStatus" NOT NULL,
    "label" TEXT,
    "acceptancePenaltyWeight" DECIMAL(10,4) NOT NULL,
    "completionPenaltyWeight" DECIMAL(10,4) NOT NULL,
    "cancellationPenaltyWeight" DECIMAL(10,4) NOT NULL,
    "loadPenaltyWeight" DECIMAL(10,4) NOT NULL,
    "reliabilityBonusWeight" DECIMAL(10,4) NOT NULL,
    "responseSpeedWeight" DECIMAL(10,4) NOT NULL,
    "offerExpiryMinutes" INTEGER NOT NULL,
    "assignedStartGraceMinutes" INTEGER NOT NULL,
    "multiPassPenaltyStep" DECIMAL(10,4) NOT NULL,
    "enableResponseSpeedWeighting" BOOLEAN NOT NULL DEFAULT true,
    "enableReliabilityWeighting" BOOLEAN NOT NULL DEFAULT true,
    "allowReofferAfterExpiry" BOOLEAN NOT NULL DEFAULT true,
    "configJson" JSONB NOT NULL,
    "createdByAdminUserId" TEXT,
    "publishedByAdminUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchConfig_status_version_idx" ON "DispatchConfig"("status", "version");
