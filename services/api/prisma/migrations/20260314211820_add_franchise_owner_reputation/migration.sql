-- CreateEnum
CREATE TYPE "ReputationTier" AS ENUM ('A', 'B', 'C', 'PROBATION');

-- CreateTable
CREATE TABLE "FranchiseOwnerReputation" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationTier" "ReputationTier" NOT NULL DEFAULT 'B',
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerReputation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwnerReputation_foId_key" ON "FranchiseOwnerReputation"("foId");

-- CreateIndex
CREATE INDEX "FranchiseOwnerReputation_reputationTier_idx" ON "FranchiseOwnerReputation"("reputationTier");

-- AddForeignKey
ALTER TABLE "FranchiseOwnerReputation" ADD CONSTRAINT "FranchiseOwnerReputation_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
