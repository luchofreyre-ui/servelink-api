-- CreateTable
CREATE TABLE "FranchiseOwnerDispatchStats" (
    "foId" TEXT NOT NULL,
    "offersSent" INTEGER NOT NULL DEFAULT 0,
    "offersAccepted" INTEGER NOT NULL DEFAULT 0,
    "offersRejected" INTEGER NOT NULL DEFAULT 0,
    "offersExpired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwnerDispatchStats_pkey" PRIMARY KEY ("foId")
);

-- AddForeignKey
ALTER TABLE "FranchiseOwnerDispatchStats" ADD CONSTRAINT "FranchiseOwnerDispatchStats_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
