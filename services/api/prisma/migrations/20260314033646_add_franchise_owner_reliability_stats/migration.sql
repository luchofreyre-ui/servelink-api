-- CreateTable
CREATE TABLE "FranchiseOwnerReliabilityStats" (
    "foId" TEXT NOT NULL,
    "assignmentsCount" INTEGER NOT NULL DEFAULT 0,
    "completionsCount" INTEGER NOT NULL DEFAULT 0,
    "cancellationsCount" INTEGER NOT NULL DEFAULT 0,
    "inProgressCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerReliabilityStats_pkey" PRIMARY KEY ("foId")
);

-- AddForeignKey
ALTER TABLE "FranchiseOwnerReliabilityStats" ADD CONSTRAINT "FranchiseOwnerReliabilityStats_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
