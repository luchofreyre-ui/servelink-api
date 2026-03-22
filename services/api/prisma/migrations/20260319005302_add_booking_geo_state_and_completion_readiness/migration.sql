-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "completionReadyAt" TIMESTAMP(3),
ADD COLUMN     "geoExitTriggeredAt" TIMESTAMP(3),
ADD COLUMN     "geoStartTriggeredAt" TIMESTAMP(3),
ADD COLUMN     "isCompletionReady" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastGeoEventAt" TIMESTAMP(3),
ADD COLUMN     "workStatus" TEXT NOT NULL DEFAULT 'not_started';

-- CreateTable
CREATE TABLE "BookingGeoState" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "lastPingAt" TIMESTAMP(3),
    "lastInsideGeofenceAt" TIMESTAMP(3),
    "lastOutsideGeofenceAt" TIMESTAMP(3),
    "insideGeofence" BOOLEAN NOT NULL DEFAULT false,
    "insideSince" TIMESTAMP(3),
    "outsideSince" TIMESTAMP(3),
    "autoSessionStartedAt" TIMESTAMP(3),
    "completionReadyMarkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingGeoState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingGeoState_bookingId_key" ON "BookingGeoState"("bookingId");

-- CreateIndex
CREATE INDEX "BookingGeoState_foId_updatedAt_idx" ON "BookingGeoState"("foId", "updatedAt");

-- AddForeignKey
ALTER TABLE "BookingGeoState" ADD CONSTRAINT "BookingGeoState_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingGeoState" ADD CONSTRAINT "BookingGeoState_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
