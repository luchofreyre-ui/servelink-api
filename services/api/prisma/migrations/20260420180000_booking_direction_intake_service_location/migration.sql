-- Public booking: persist service address + geocoded coordinates for routing / estimate replay.
ALTER TABLE "BookingDirectionIntake"
ADD COLUMN "serviceLocationStreet" TEXT,
ADD COLUMN "serviceLocationCity" TEXT,
ADD COLUMN "serviceLocationState" TEXT,
ADD COLUMN "serviceLocationZip" TEXT,
ADD COLUMN "serviceLocationUnit" TEXT,
ADD COLUMN "siteLat" DOUBLE PRECISION,
ADD COLUMN "siteLng" DOUBLE PRECISION;
