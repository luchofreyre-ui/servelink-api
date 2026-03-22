-- AlterTable
ALTER TABLE "FranchiseOwnerReliabilityStats" ADD COLUMN     "activeAssignedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "activeInProgressCount" INTEGER NOT NULL DEFAULT 0;
