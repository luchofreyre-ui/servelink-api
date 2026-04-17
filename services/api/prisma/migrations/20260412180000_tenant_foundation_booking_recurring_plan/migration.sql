-- Tenant foundation: canonical tenantId on Booking (default nustandard).
-- RecurringPlan is created later (20260413180000_recurring_plan_orchestration); its tenantId
-- is added in 20260413180100_recurring_plan_add_tenant_id to preserve migration order.

ALTER TABLE "Booking" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'nustandard';

CREATE INDEX "Booking_tenantId_idx" ON "Booking"("tenantId");
