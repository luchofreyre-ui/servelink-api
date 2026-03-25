-- CreateTable
CREATE TABLE "KnowledgeFeedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "franchiseOwnerId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "sopKey" TEXT,
    "playbookKey" TEXT,
    "outcome" TEXT NOT NULL,
    "effortActual" TEXT,
    "timeTakenMinutes" INTEGER,
    "timeExpectedMinutes" INTEGER,
    "notes" TEXT,

    CONSTRAINT "KnowledgeFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeFeedback_bookingId_idx" ON "KnowledgeFeedback"("bookingId");

-- CreateIndex
CREATE INDEX "KnowledgeFeedback_franchiseOwnerId_idx" ON "KnowledgeFeedback"("franchiseOwnerId");

-- CreateIndex
CREATE INDEX "KnowledgeFeedback_scenarioId_idx" ON "KnowledgeFeedback"("scenarioId");

-- CreateIndex
CREATE INDEX "KnowledgeFeedback_sopKey_idx" ON "KnowledgeFeedback"("sopKey");

-- AddForeignKey
ALTER TABLE "KnowledgeFeedback" ADD CONSTRAINT "KnowledgeFeedback_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFeedback" ADD CONSTRAINT "KnowledgeFeedback_franchiseOwnerId_fkey" FOREIGN KEY ("franchiseOwnerId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
