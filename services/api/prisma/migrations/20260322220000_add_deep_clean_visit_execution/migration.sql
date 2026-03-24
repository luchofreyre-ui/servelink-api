-- CreateEnum
CREATE TYPE "DeepCleanVisitExecutionStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "BookingDeepCleanVisitExecution" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "visitNumber" INTEGER NOT NULL,
    "status" "DeepCleanVisitExecutionStatus" NOT NULL DEFAULT 'not_started',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualDurationMinutes" INTEGER,
    "operatorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDeepCleanVisitExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDeepCleanVisitExecution_bookingId_visitNumber_key" ON "BookingDeepCleanVisitExecution"("bookingId", "visitNumber");

-- CreateIndex
CREATE INDEX "BookingDeepCleanVisitExecution_bookingId_status_idx" ON "BookingDeepCleanVisitExecution"("bookingId", "status");

-- CreateIndex
CREATE INDEX "BookingDeepCleanVisitExecution_programId_idx" ON "BookingDeepCleanVisitExecution"("programId");

-- AddForeignKey
ALTER TABLE "BookingDeepCleanVisitExecution" ADD CONSTRAINT "BookingDeepCleanVisitExecution_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDeepCleanVisitExecution" ADD CONSTRAINT "BookingDeepCleanVisitExecution_programId_fkey" FOREIGN KEY ("programId") REFERENCES "BookingDeepCleanProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
