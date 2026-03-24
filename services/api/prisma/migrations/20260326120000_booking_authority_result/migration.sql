-- CreateEnum
CREATE TYPE "BookingAuthorityReviewStatus" AS ENUM ('auto', 'reviewed', 'overridden');

-- CreateTable
CREATE TABLE "BookingAuthorityResult" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "surfacesJson" TEXT NOT NULL,
    "problemsJson" TEXT NOT NULL,
    "methodsJson" TEXT NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "resolutionVersion" INTEGER NOT NULL,
    "status" "BookingAuthorityReviewStatus" NOT NULL DEFAULT 'auto',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingAuthorityResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingAuthorityResult_bookingId_key" ON "BookingAuthorityResult"("bookingId");

CREATE INDEX "BookingAuthorityResult_status_idx" ON "BookingAuthorityResult"("status");

-- AddForeignKey
ALTER TABLE "BookingAuthorityResult" ADD CONSTRAINT "BookingAuthorityResult_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingAuthorityResult" ADD CONSTRAINT "BookingAuthorityResult_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
