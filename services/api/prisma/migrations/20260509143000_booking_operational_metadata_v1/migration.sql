-- Booking operational metadata sidecar (1:1). Additive only.
CREATE TABLE "BookingOperationalMetadata" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingOperationalMetadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingOperationalMetadata_bookingId_key" ON "BookingOperationalMetadata"("bookingId");

CREATE INDEX "BookingOperationalMetadata_bookingId_idx" ON "BookingOperationalMetadata"("bookingId");

ALTER TABLE "BookingOperationalMetadata" ADD CONSTRAINT "BookingOperationalMetadata_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
