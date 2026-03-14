-- AlterTable
ALTER TABLE "FranchiseOwner" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "completedJobsCount" INTEGER DEFAULT 0,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "homeLat" DOUBLE PRECISION,
ADD COLUMN     "homeLng" DOUBLE PRECISION,
ADD COLUMN     "maxDailyLaborMinutes" INTEGER,
ADD COLUMN     "maxLaborMinutes" INTEGER,
ADD COLUMN     "maxSquareFootage" INTEGER,
ADD COLUMN     "maxTravelMinutes" INTEGER DEFAULT 60,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "reliabilityScore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "teamSize" INTEGER,
ADD COLUMN     "yearsExperience" INTEGER;

-- CreateIndex
CREATE INDEX "FranchiseOwner_status_safetyHold_idx" ON "FranchiseOwner"("status", "safetyHold");

-- CreateIndex
CREATE INDEX "FranchiseOwner_homeLat_homeLng_idx" ON "FranchiseOwner"("homeLat", "homeLng");

-- CreateIndex
CREATE INDEX "FranchiseOwner_teamSize_idx" ON "FranchiseOwner"("teamSize");

-- CreateIndex
CREATE INDEX "FranchiseOwner_maxTravelMinutes_idx" ON "FranchiseOwner"("maxTravelMinutes");
