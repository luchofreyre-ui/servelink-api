-- CreateTable
CREATE TABLE "FranchiseOwnerJobTypeStats" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "jobSizeBand" TEXT,
    "assignmentsCount" INTEGER NOT NULL DEFAULT 0,
    "completionsCount" INTEGER NOT NULL DEFAULT 0,
    "cancellationsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerJobTypeStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FranchiseOwnerJobTypeStats_foId_idx" ON "FranchiseOwnerJobTypeStats"("foId");

-- CreateIndex
CREATE INDEX "FranchiseOwnerJobTypeStats_serviceType_jobSizeBand_idx" ON "FranchiseOwnerJobTypeStats"("serviceType", "jobSizeBand");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwnerJobTypeStats_foId_serviceType_jobSizeBand_key" ON "FranchiseOwnerJobTypeStats"("foId", "serviceType", "jobSizeBand");

-- AddForeignKey
ALTER TABLE "FranchiseOwnerJobTypeStats" ADD CONSTRAINT "FranchiseOwnerJobTypeStats_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
