-- CreateTable
CREATE TABLE "DispatchOperatorNote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchOperatorNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchOperatorNote_bookingId_createdAt_idx" ON "DispatchOperatorNote"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchOperatorNote_adminUserId_createdAt_idx" ON "DispatchOperatorNote"("adminUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "DispatchOperatorNote" ADD CONSTRAINT "DispatchOperatorNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
