import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { AdminGuard } from "../../../guards/admin.guard";
import { AdminPermissions } from "../../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../../common/admin/admin-permissions.guard";
import { PaymentReliabilityService } from "../../bookings/payment-reliability/payment-reliability.service";

@Controller("api/v1/admin/payments")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class AdminPaymentsController {
  constructor(private readonly paymentReliability: PaymentReliabilityService) {}

  @Get("ops-summary")
  @AdminPermissions("exceptions.read")
  async getOpsSummary() {
    const summary = await this.paymentReliability.getPaymentOpsSummary();
    return { ok: true, item: summary };
  }

  @Get("anomalies")
  @AdminPermissions("exceptions.read")
  async listAnomalies(@Query("bookingId") bookingId?: string) {
    const rows = await this.paymentReliability.getOpenAnomalies({
      take: 50,
      bookingId: bookingId?.trim() || undefined,
    });
    return {
      ok: true,
      items: rows.map((a) => ({
        id: a.id,
        bookingId: a.bookingId,
        kind: a.kind,
        severity: a.severity,
        message: a.message,
        detectedAt: a.detectedAt.toISOString(),
        stripeEventId: a.stripeEventId,
      })),
    };
  }
}
