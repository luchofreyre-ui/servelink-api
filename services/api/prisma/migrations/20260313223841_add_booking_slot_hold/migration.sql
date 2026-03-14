-- CreateTable
CREATE TABLE "BookingSlotHold" (
    "id" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSlotHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingSlotHold_foId_startAt_endAt_idx" ON "BookingSlotHold"("foId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "BookingSlotHold_expiresAt_idx" ON "BookingSlotHold"("expiresAt");

-- CreateIndex
CREATE INDEX "BookingSlotHold_foId_expiresAt_idx" ON "BookingSlotHold"("foId", "expiresAt");

-- AddForeignKey
ALTER TABLE "BookingSlotHold" ADD CONSTRAINT "BookingSlotHold_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
