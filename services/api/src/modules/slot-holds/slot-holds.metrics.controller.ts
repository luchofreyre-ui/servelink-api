import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SlotHoldMetrics } from "./slot-holds.metrics";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/metrics/slot-holds")
export class SlotHoldsMetricsController {
  @Get()
  getMetrics() {
    return {
      holdsCreated: SlotHoldMetrics.created,
      holdsExpired: SlotHoldMetrics.expired,
      holdsConfirmed: SlotHoldMetrics.confirmed,
      holdConflicts: SlotHoldMetrics.conflicts,
    };
  }
}
