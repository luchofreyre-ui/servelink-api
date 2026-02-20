import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { PayoutsService } from "./payouts.service";

type AuthedRequest = { user?: { userId: string; role: string } };

@Controller("/api/v1/admin/payouts")
@UseGuards(JwtAuthGuard, AdminGuard)
export class PayoutsAdminController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get("preview")
  async preview(
    @Query("asOf") asOf?: string,
    @Query("currency") currency?: string,
  ) {
    const asOfDate =
      asOf && String(asOf).trim()
        ? new Date(String(asOf).trim())
        : undefined;
    if (asOf && asOfDate != null && isNaN(asOfDate.getTime())) {
      return this.payouts.previewEligible({ currency: currency ?? "usd" });
    }
    return this.payouts.previewEligible({
      asOf: asOfDate,
      currency: (currency ?? "usd").toString().toLowerCase(),
    });
  }

  @Post("lock")
  async lock(
    @Body()
    body: {
      asOf?: string;
      currency?: string;
      idempotencyKey: string;
    },
  ) {
    const idempotencyKey = String(body?.idempotencyKey ?? "").trim();
    if (!idempotencyKey) {
      throw new BadRequestException("idempotencyKey is required");
    }
    const asOf =
      body?.asOf && String(body.asOf).trim()
        ? new Date(String(body.asOf).trim())
        : undefined;
    const currency = (body?.currency ?? "usd").toString().toLowerCase();
    return this.payouts.lockBatch({
      asOf,
      currency,
      idempotencyKey,
    });
  }

  @Post("mark-executed")
  async markExecuted(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      batchId: string;
      idempotencyKey: string;
    },
  ) {
    const batchId = String(body?.batchId ?? "").trim();
    const idempotencyKey = String(body?.idempotencyKey ?? "").trim();
    if (!batchId) throw new BadRequestException("batchId is required");
    if (!idempotencyKey) throw new BadRequestException("idempotencyKey is required");
    return this.payouts.markExecuted({
      batchId,
      idempotencyKey,
      actorAdminId: req.user?.userId ?? undefined,
    });
  }
}
