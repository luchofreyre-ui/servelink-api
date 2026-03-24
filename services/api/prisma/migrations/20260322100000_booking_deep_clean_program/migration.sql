-- CreateTable
CREATE TABLE "BookingDeepCleanProgram" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL,
    "visitsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDeepCleanProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDeepCleanProgram_bookingId_key" ON "BookingDeepCleanProgram"("bookingId");

-- CreateIndex
CREATE INDEX "BookingDeepCleanProgram_programType_idx" ON "BookingDeepCleanProgram"("programType");

-- AddForeignKey
ALTER TABLE "BookingDeepCleanProgram" ADD CONSTRAINT "BookingDeepCleanProgram_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
