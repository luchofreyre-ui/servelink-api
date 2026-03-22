-- CreateTable
CREATE TABLE "BookingDispatchControl" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "holdActive" BOOLEAN NOT NULL DEFAULT false,
    "holdReason" TEXT,
    "holdSource" TEXT,
    "holdSetByAdminId" TEXT,
    "holdSetAt" TIMESTAMP(3),
    "holdReleasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingDispatchControl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDispatchControl_bookingId_key" ON "BookingDispatchControl"("bookingId");

-- CreateIndex
CREATE INDEX "BookingDispatchControl_holdActive_createdAt_idx" ON "BookingDispatchControl"("holdActive", "createdAt");
