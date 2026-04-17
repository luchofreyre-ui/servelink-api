-- Tenant foundation: canonical tenantId on Booking and RecurringPlan (default nustandard).

ALTER TABLE "Booking" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'nustandard';

CREATE INDEX "Booking_tenantId_idx" ON "Booking"("tenantId");

ALTER TABLE "RecurringPlan" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'nustandard';

CREATE INDEX "RecurringPlan_tenantId_idx" ON "RecurringPlan"("tenantId");
