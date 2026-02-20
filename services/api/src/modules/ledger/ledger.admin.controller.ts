import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { LedgerService } from "./ledger.service";

@Controller("/api/v1/admin/ledger")
@UseGuards(JwtAuthGuard, AdminGuard)
export class LedgerAdminController {
  constructor(private readonly ledger: LedgerService) {}

  @Get("entries")
  async listEntries(
    @Query("bookingId") bookingId?: string,
    @Query("foId") foId?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ) {
    const result = await this.ledger.listEntries({
      bookingId:
        bookingId && String(bookingId).trim()
          ? String(bookingId).trim()
          : undefined,
      foId: foId && String(foId).trim() ? String(foId).trim() : undefined,
      limit:
        limit != null
          ? Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50))
          : 50,
      cursor: cursor && String(cursor).trim() ? String(cursor).trim() : undefined,
    });
    return {
      items: result.items,
      nextCursor: result.nextCursor ?? null,
    };
  }

  @Get("entries/:id")
  async getEntry(@Param("id") id: string) {
    const entry = await this.ledger.getEntry(id);
    if (!entry) throw new NotFoundException("LEDGER_ENTRY_NOT_FOUND");
    return entry;
  }

  @Get("balances")
  async getBalances(@Query("foId") foId?: string, @Query("asOf") asOf?: string) {
    const asOfDate =
      asOf && String(asOf).trim() ? new Date(String(asOf).trim()) : undefined;
    if (asOf && isNaN(asOfDate!.getTime())) {
      return { balances: {} };
    }
    const balances = await this.ledger.getBalances({
      foId: foId && String(foId).trim() ? String(foId).trim() : undefined,
      asOf: asOfDate,
    });
    return { balances };
  }

  /**
   * Booking-level ledger snapshot for admin (currency required).
   * GET /api/v1/admin/ledger/bookings/:id/snapshot?currency=usd
   */
  @Get("bookings/:id/snapshot")
  async getBookingSnapshotById(
    @Param("id") id: string,
    @Query("currency") currency: string,
  ) {
    if (!currency) throw new BadRequestException("currency is required");
    return this.ledger.getBookingSnapshot({ bookingId: id, currency });
  }

  /**
   * Booking-level ledger snapshot for admin debugging / audit.
   * GET /api/v1/admin/ledger/booking/:bookingId/snapshot?currency=usd
   */
  @Get("booking/:bookingId/snapshot")
  async getBookingSnapshot(
    @Param("bookingId") bookingIdParam: string,
    @Query("currency") currency?: string,
  ) {
    const bookingId =
      bookingIdParam && String(bookingIdParam).trim()
        ? String(bookingIdParam).trim()
        : "";

    if (!bookingId) {
      throw new BadRequestException("BOOKING_ID_REQUIRED");
    }

    const cur =
      currency && String(currency).trim()
        ? String(currency).trim().toLowerCase()
        : "usd";

    return this.ledger.getBookingSnapshot({ bookingId, currency: cur });
  }

  /**
   * Ledger integrity validator (admin-only).
   * POST /api/v1/admin/ledger/validate?currency=usd&since=...&until=...&limit=...
   *
   * Note: returns scan + violations; does not modify data.
   */
  @Post("validate")
  @HttpCode(HttpStatus.OK)
  async validateLedger(
    @Query("currency") currency?: string,
    @Query("since") since?: string,
    @Query("until") until?: string,
    @Query("limit") limit?: string,
    @Query("evidence") evidence?: string,
  ) {
    const cur =
      currency && String(currency).trim()
        ? String(currency).trim().toLowerCase()
        : undefined;

    const sinceDate =
      since && String(since).trim() ? new Date(String(since).trim()) : undefined;
    const untilDate =
      until && String(until).trim() ? new Date(String(until).trim()) : undefined;

    if (since && (!sinceDate || isNaN(sinceDate.getTime()))) {
      throw new BadRequestException("INVALID_SINCE");
    }
    if (until && (!untilDate || isNaN(untilDate.getTime()))) {
      throw new BadRequestException("INVALID_UNTIL");
    }

    const cap =
      limit != null
        ? Math.min(5000, Math.max(1, parseInt(String(limit), 10) || 500))
        : 500;

    const evidenceFlag =
      String(evidence ?? "").toLowerCase() === "1" ||
      String(evidence ?? "").toLowerCase() === "true";

    return this.ledger.validateLedger({
      currency: cur,
      since: sinceDate,
      until: untilDate,
      limit: cap,
      evidence: evidenceFlag,
    });
  }
}
