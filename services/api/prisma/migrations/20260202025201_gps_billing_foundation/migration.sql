-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "geofenceRadiusMeters" INTEGER DEFAULT 100,
ADD COLUMN     "siteLat" DOUBLE PRECISION,
ADD COLUMN     "siteLng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "LocationPing" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracyM" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationPing_bookingId_receivedAt_idx" ON "LocationPing"("bookingId", "receivedAt");

-- CreateIndex
CREATE INDEX "LocationPing_foId_receivedAt_idx" ON "LocationPing"("foId", "receivedAt");

-- AddForeignKey
ALTER TABLE "LocationPing" ADD CONSTRAINT "LocationPing_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
