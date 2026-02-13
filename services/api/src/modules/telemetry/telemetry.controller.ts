import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { BillingService } from "../billing/billing.service";

/**
 * FO telemetry ingestion. Writes LocationPing and reconciles billing sessions.
 */
@UseGuards(JwtAuthGuard)
@Controller("/api/v1/telemetry")
export class TelemetryController {
  constructor(
    private readonly db: PrismaService,
    private readonly billing: BillingService,
  ) {}

  @Post("ping")
  async ping(
    @Req() req: any,
    @Body()
    body: {
      bookingId: string;
      lat: number;
      lng: number;
      accuracyM: number;
      capturedAt: string;
    },
  ) {
    // FO-only: role comes from JWT
    if (req.user.role !== "fo") {
      return { ignored: true };
    }

    const foId = String(req.user.userId);
    const capturedAt = new Date(body.capturedAt);

    const ping = await this.db.locationPing.create({
      data: {
        bookingId: body.bookingId,
        foId,
        lat: body.lat,
        lng: body.lng,
        accuracyM: body.accuracyM,
        capturedAt,
      },
    });

    const billingResult = await this.billing.reconcileFromPing({
      bookingId: body.bookingId,
      foId,
      pingLat: body.lat,
      pingLng: body.lng,
      accuracyM: body.accuracyM ?? undefined,
      capturedAt,
    });

    return { ping, billing: billingResult };
  }
}
