-- AlterTable
ALTER TABLE "FranchiseOwnerDispatchStats" ADD COLUMN     "averageResponseSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "responseCount" INTEGER NOT NULL DEFAULT 0;
