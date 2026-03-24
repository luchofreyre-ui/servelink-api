-- CreateTable
CREATE TABLE "FoAuthorityKnowledgeFeedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "franchiseOwnerId" TEXT NOT NULL,
    "helpful" BOOLEAN,
    "selectedKnowledgePath" TEXT,
    "notes" TEXT,

    CONSTRAINT "FoAuthorityKnowledgeFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoAuthorityKnowledgeFeedback_bookingId_idx" ON "FoAuthorityKnowledgeFeedback"("bookingId");

-- CreateIndex
CREATE INDEX "FoAuthorityKnowledgeFeedback_franchiseOwnerId_idx" ON "FoAuthorityKnowledgeFeedback"("franchiseOwnerId");

-- CreateIndex
CREATE INDEX "FoAuthorityKnowledgeFeedback_createdAt_idx" ON "FoAuthorityKnowledgeFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "FoAuthorityKnowledgeFeedback" ADD CONSTRAINT "FoAuthorityKnowledgeFeedback_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoAuthorityKnowledgeFeedback" ADD CONSTRAINT "FoAuthorityKnowledgeFeedback_franchiseOwnerId_fkey" FOREIGN KEY ("franchiseOwnerId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
