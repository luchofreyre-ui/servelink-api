-- CreateEnum
CREATE TYPE "DeepCleanEstimatorConfigStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateTable
CREATE TABLE "DeepCleanEstimatorConfig" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DeepCleanEstimatorConfigStatus" NOT NULL,
    "label" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorConfig_version_key" ON "DeepCleanEstimatorConfig"("version");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorConfig_status_version_idx" ON "DeepCleanEstimatorConfig"("status", "version");

-- AlterTable
ALTER TABLE "BookingEstimateSnapshot" ADD COLUMN "deepCleanEstimatorConfigId" TEXT,
ADD COLUMN "deepCleanEstimatorConfigVersion" INTEGER,
ADD COLUMN "deepCleanEstimatorConfigLabel" TEXT;
