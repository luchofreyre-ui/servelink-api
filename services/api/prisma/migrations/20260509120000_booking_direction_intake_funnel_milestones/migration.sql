-- Append-only operational funnel echoes for public booking (server-capped JSON array).
ALTER TABLE "BookingDirectionIntake" ADD COLUMN "funnelMilestones" JSONB;
