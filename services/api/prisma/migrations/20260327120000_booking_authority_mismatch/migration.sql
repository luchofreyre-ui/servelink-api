-- CreateEnum
CREATE TYPE "BookingAuthorityMismatchType" AS ENUM (
  'missing_surface',
  'missing_problem',
  'missing_method',
  'incorrect_surface',
  'incorrect_problem',
  'incorrect_method',
  'over_tagging',
  'under_tagging',
  'other'
);

-- CreateTable
CREATE TABLE "BookingAuthorityMismatch" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorityResultId" TEXT NOT NULL,
    "mismatchType" "BookingAuthorityMismatchType" NOT NULL,
    "notes" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAuthorityMismatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingAuthorityMismatch_bookingId_idx" ON "BookingAuthorityMismatch"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAuthorityMismatch_authorityResultId_idx" ON "BookingAuthorityMismatch"("authorityResultId");

-- CreateIndex
CREATE INDEX "BookingAuthorityMismatch_createdAt_idx" ON "BookingAuthorityMismatch"("createdAt");

-- AddForeignKey
ALTER TABLE "BookingAuthorityMismatch" ADD CONSTRAINT "BookingAuthorityMismatch_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuthorityMismatch" ADD CONSTRAINT "BookingAuthorityMismatch_authorityResultId_fkey" FOREIGN KEY ("authorityResultId") REFERENCES "BookingAuthorityResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuthorityMismatch" ADD CONSTRAINT "BookingAuthorityMismatch_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
