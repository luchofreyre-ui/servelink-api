-- Booking direction / service-request intake from public site (not a committed Booking).

CREATE TABLE "BookingDirectionIntake" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "homeSize" TEXT NOT NULL,
    "bedrooms" TEXT NOT NULL,
    "bathrooms" TEXT NOT NULL,
    "pets" TEXT NOT NULL DEFAULT '',
    "frequency" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "source" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingDirectionIntake_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingDirectionIntake_createdAt_idx" ON "BookingDirectionIntake"("createdAt");

CREATE INDEX "BookingDirectionIntake_serviceId_createdAt_idx" ON "BookingDirectionIntake"("serviceId", "createdAt");
