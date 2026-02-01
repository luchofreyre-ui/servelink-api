-- CreateEnum
CREATE TYPE "BookingEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'NOTE');

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "BookingEventType" NOT NULL DEFAULT 'STATUS_CHANGED',
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus",
    "note" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingEvent_bookingId_idempotencyKey_key" ON "BookingEvent"("bookingId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
