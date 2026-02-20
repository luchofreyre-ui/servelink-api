import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { StripeReconcileService } from "./stripe.reconcile.service";

@Controller("/api/v1/admin/stripe/reconcile")
@UseGuards(JwtAuthGuard, AdminGuard)
export class StripeReconcileAdminController {
  constructor(private readonly reconcile: StripeReconcileService) {}

  @Get("/summary")
  @HttpCode(HttpStatus.OK)
  async summary(
    @Query("currency") currency?: string,
    @Query("since") since?: string,
    @Query("until") until?: string,
  ) {
    const cur = String(currency ?? "").toLowerCase();
    if (!cur) throw new ForbiddenException("currency is required");

    const sinceDate = since ? new Date(since) : undefined;
    const untilDate = until ? new Date(until) : undefined;

    if (since && Number.isNaN(sinceDate!.getTime())) {
      throw new ForbiddenException("invalid since");
    }
    if (until && Number.isNaN(untilDate!.getTime())) {
      throw new ForbiddenException("invalid until");
    }

    return this.reconcile.summary({
      currency: cur,
      since: sinceDate,
      until: untilDate,
    });
  }

  @Get("/mismatches")
  @HttpCode(HttpStatus.OK)
  async mismatches(
    @Query("currency") currency?: string,
    @Query("since") since?: string,
    @Query("until") until?: string,
    @Query("limit") limit?: string,
    @Query("evidence") evidence?: string,
  ) {
    const cur = String(currency ?? "").toLowerCase();
    if (!cur) throw new ForbiddenException("currency is required");

    const sinceDate = since ? new Date(since) : undefined;
    const untilDate = until ? new Date(until) : undefined;

    if (since && Number.isNaN(sinceDate!.getTime())) throw new ForbiddenException("invalid since");
    if (until && Number.isNaN(untilDate!.getTime())) throw new ForbiddenException("invalid until");

    const limitNum = limit != null && String(limit).trim() !== "" ? Number(limit) : undefined;
    if (limitNum != null && (!Number.isFinite(limitNum) || limitNum <= 0)) {
      throw new ForbiddenException("invalid limit");
    }

    const evidenceFlag =
      String(evidence ?? "").toLowerCase() === "1" ||
      String(evidence ?? "").toLowerCase() === "true";

    return this.reconcile.mismatches({
      currency: cur,
      since: sinceDate,
      until: untilDate,
      limit: limitNum,
      evidence: evidenceFlag,
    });
  }
}
