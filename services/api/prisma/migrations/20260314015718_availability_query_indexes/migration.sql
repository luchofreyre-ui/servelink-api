-- CreateIndex
CREATE INDEX "Booking_foId_status_scheduledStart_idx" ON "Booking"("foId", "status", "scheduledStart");

-- CreateIndex
CREATE INDEX "Booking_foId_scheduledStart_idx" ON "Booking"("foId", "scheduledStart");

-- CreateIndex
CREATE INDEX "BookingSlotHold_foId_startAt_idx" ON "BookingSlotHold"("foId", "startAt");
