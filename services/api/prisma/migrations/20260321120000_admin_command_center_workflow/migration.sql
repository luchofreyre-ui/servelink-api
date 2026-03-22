-- CreateEnum
CREATE TYPE "AdminBookingWorkflowState" AS ENUM ('open', 'held', 'in_review', 'approved', 'reassign_requested');

-- AlterTable
ALTER TABLE "BookingDispatchControl" ADD COLUMN "workflowState" "AdminBookingWorkflowState" NOT NULL DEFAULT 'open';
ALTER TABLE "BookingDispatchControl" ADD COLUMN "commandCenterOperatorNote" TEXT;

-- AddForeignKey (BookingDispatchControl -> Booking)
ALTER TABLE "BookingDispatchControl"
ADD CONSTRAINT "BookingDispatchControl_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AdminCommandCenterActivity" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL DEFAULT 'admin',
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCommandCenterActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminCommandCenterActivity_bookingId_createdAt_idx" ON "AdminCommandCenterActivity"("bookingId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminCommandCenterActivity"
ADD CONSTRAINT "AdminCommandCenterActivity_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
