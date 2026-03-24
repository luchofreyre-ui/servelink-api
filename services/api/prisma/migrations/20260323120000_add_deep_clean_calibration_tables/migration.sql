-- CreateTable
CREATE TABLE "BookingDeepCleanVisitCalibration" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "visitNumber" INTEGER NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "actualDurationMinutes" INTEGER,
    "durationVarianceMinutes" INTEGER,
    "durationVariancePercent" DECIMAL(10,2),
    "executionStatus" "DeepCleanVisitExecutionStatus" NOT NULL,
    "hasOperatorNote" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDeepCleanVisitCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDeepCleanProgramCalibration" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "estimatedTotalDurationMinutes" INTEGER NOT NULL,
    "actualTotalDurationMinutes" INTEGER,
    "durationVarianceMinutes" INTEGER,
    "durationVariancePercent" DECIMAL(10,2),
    "totalVisits" INTEGER NOT NULL,
    "completedVisits" INTEGER NOT NULL,
    "isFullyCompleted" BOOLEAN NOT NULL,
    "hasAnyOperatorNotes" BOOLEAN NOT NULL DEFAULT false,
    "usableForCalibrationAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDeepCleanProgramCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDeepCleanVisitCalibration_bookingId_visitNumber_key" ON "BookingDeepCleanVisitCalibration"("bookingId", "visitNumber");

-- CreateIndex
CREATE INDEX "BookingDeepCleanVisitCalibration_programId_idx" ON "BookingDeepCleanVisitCalibration"("programId");

-- CreateIndex
CREATE INDEX "BookingDeepCleanVisitCalibration_bookingId_executionStatus_idx" ON "BookingDeepCleanVisitCalibration"("bookingId", "executionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BookingDeepCleanProgramCalibration_bookingId_key" ON "BookingDeepCleanProgramCalibration"("bookingId");

-- CreateIndex
CREATE INDEX "BookingDeepCleanProgramCalibration_programId_idx" ON "BookingDeepCleanProgramCalibration"("programId");

-- CreateIndex
CREATE INDEX "BookingDeepCleanProgramCalibration_isFullyCompleted_idx" ON "BookingDeepCleanProgramCalibration"("isFullyCompleted");

-- AddForeignKey
ALTER TABLE "BookingDeepCleanVisitCalibration" ADD CONSTRAINT "BookingDeepCleanVisitCalibration_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDeepCleanVisitCalibration" ADD CONSTRAINT "BookingDeepCleanVisitCalibration_programId_fkey" FOREIGN KEY ("programId") REFERENCES "BookingDeepCleanProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD CONSTRAINT "BookingDeepCleanProgramCalibration_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD CONSTRAINT "BookingDeepCleanProgramCalibration_programId_fkey" FOREIGN KEY ("programId") REFERENCES "BookingDeepCleanProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
