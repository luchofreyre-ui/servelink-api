-- AlterTable
ALTER TABLE "BookingDispatchControl"
ADD COLUMN "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reviewReason" TEXT,
ADD COLUMN "reviewSource" TEXT,
ADD COLUMN "reviewRequestedByAdminId" TEXT,
ADD COLUMN "reviewRequestedAt" TIMESTAMP(3),
ADD COLUMN "reviewCompletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BookingDispatchControl_reviewRequired_createdAt_idx"
ON "BookingDispatchControl"("reviewRequired", "createdAt");
