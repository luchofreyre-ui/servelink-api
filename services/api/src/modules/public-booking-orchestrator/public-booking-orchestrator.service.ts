import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { FoService, type JobMatchInput } from "../fo/fo.service";
import { BookingsService } from "../bookings/bookings.service";
import { SlotAvailabilityService } from "../slot-holds/slot-availability.service";
import { SlotHoldsService } from "../slot-holds/slot-holds.service";
import type { PublicAvailabilityQueryDto } from "./dto/public-availability-query.dto";
import type { PublicSlotConfirmDto } from "./dto/public-slot-confirm.dto";
import type { PublicSlotSelectDto } from "./dto/public-slot-select.dto";
import type {
  PublicBookingTeamOption,
  PublicBookingWindow,
} from "./public-booking-orchestrator.types";

const MAX_FO_CANDIDATES = 8;
const MAX_WINDOWS_TOTAL = 60;
const DEFAULT_RANGE_DAYS = 14;

type BookingForOrchestration = {
  id: string;
  status: BookingStatus;
  foId: string | null;
  preferredFoId: string | null;
  scheduledStart: Date | null;
  estimatedHours: number;
  siteLat: number | null;
  siteLng: number | null;
  estimateSnapshot: { outputJson: string; inputJson: string } | null;
};

function approxSqftFromBand(band: string): number {
  const m: Record<string, number> = {
    "0_799": 600,
    "800_1199": 1000,
    "1200_1599": 1400,
    "1600_1999": 1800,
    "2000_2499": 2250,
    "2500_2999": 2750,
    "3000_3499": 3250,
    "3500_plus": 4000,
  };
  return m[band] ?? 1500;
}

function extractFoIdsFromEstimateOutput(outputJson: string | null): string[] {
  if (!outputJson?.trim()) return [];
  try {
    const o = JSON.parse(outputJson) as Record<string, unknown>;
    const pools = [o.matchedCleaners, o.dispatchCandidatePool];
    const ids: string[] = [];
    for (const p of pools) {
      if (!Array.isArray(p)) continue;
      for (const item of p) {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as { id?: unknown }).id === "string"
        ) {
          ids.push(String((item as { id: string }).id));
        }
      }
    }
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

function parseEstimateJobMatchFields(snapshot: {
  outputJson: string;
  inputJson: string;
}): {
  squareFootage: number;
  estimatedLaborMinutes: number;
  recommendedTeamSize: number;
} | null {
  try {
    const out = JSON.parse(snapshot.outputJson) as Record<string, unknown>;
    const inp = JSON.parse(snapshot.inputJson) as Record<string, unknown>;
    const sqftBand =
      typeof inp.sqft_band === "string" ? inp.sqft_band : "1200_1599";
    const squareFootage = approxSqftFromBand(sqftBand);
    const estimateMinutesRaw = out.estimateMinutes;
    const estimatedDurationMinutesRaw = out.estimatedDurationMinutes;
    const effectiveTeamSizeRaw = out.effectiveTeamSize;
    const recommendedTeamSizeRaw = out.recommendedTeamSize;

    const estimatedLaborMinutes =
      typeof estimateMinutesRaw === "number" && Number.isFinite(estimateMinutesRaw)
        ? Math.max(1, Math.floor(estimateMinutesRaw))
        : typeof estimatedDurationMinutesRaw === "number" &&
            Number.isFinite(estimatedDurationMinutesRaw) &&
            typeof effectiveTeamSizeRaw === "number" &&
            Number.isFinite(effectiveTeamSizeRaw) &&
            effectiveTeamSizeRaw > 0
          ? Math.max(
              1,
              Math.floor(estimatedDurationMinutesRaw * effectiveTeamSizeRaw),
            )
          : 120;

    const recommendedTeamSize =
      typeof recommendedTeamSizeRaw === "number" &&
      Number.isFinite(recommendedTeamSizeRaw) &&
      recommendedTeamSizeRaw > 0
        ? Math.max(1, Math.floor(recommendedTeamSizeRaw))
        : 1;

    return { squareFootage, estimatedLaborMinutes, recommendedTeamSize };
  } catch {
    return null;
  }
}

@Injectable()
export class PublicBookingOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotAvailability: SlotAvailabilityService,
    private readonly slotHolds: SlotHoldsService,
    private readonly bookings: BookingsService,
    private readonly fo: FoService,
  ) {}

  private throwOrchestrator(code: string, message: string): never {
    throw new BadRequestException({ code, message });
  }

  private async loadBookingForOrchestration(
    bookingId: string,
  ): Promise<BookingForOrchestration | null> {
    const row = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        foId: true,
        preferredFoId: true,
        scheduledStart: true,
        estimatedHours: true,
        siteLat: true,
        siteLng: true,
        estimateSnapshot: {
          select: { outputJson: true, inputJson: true },
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      foId: row.foId,
      preferredFoId: row.preferredFoId,
      scheduledStart: row.scheduledStart,
      estimatedHours: Number(row.estimatedHours ?? 0),
      siteLat: row.siteLat,
      siteLng: row.siteLng,
      estimateSnapshot: row.estimateSnapshot,
    };
  }

  private assertSchedulableForAvailability(booking: BookingForOrchestration) {
    if (booking.status !== BookingStatus.pending_payment) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_NOT_SCHEDULABLE_STATUS",
        "This booking cannot be scheduled in its current status.",
      );
    }
    if (booking.scheduledStart != null) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_ALREADY_SCHEDULED",
        "This booking already has a scheduled start time.",
      );
    }
    if (!(booking.estimatedHours > 0)) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_NO_DURATION",
        "This booking has no estimated duration; run estimation before scheduling.",
      );
    }
    if (!booking.estimateSnapshot?.outputJson?.trim()) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_NO_ESTIMATE_SNAPSHOT",
        "This booking has no estimate snapshot.",
      );
    }
  }

  private durationMinutesFromBooking(booking: BookingForOrchestration): number {
    return Math.max(1, Math.round(booking.estimatedHours * 60));
  }

  private async resolveFoCandidateIds(
    booking: BookingForOrchestration,
  ): Promise<string[]> {
    if (booking.foId?.trim()) {
      return [booking.foId.trim()];
    }

    let ids: string[] = [];

    const fromSnapshot = extractFoIdsFromEstimateOutput(
      booking.estimateSnapshot?.outputJson ?? null,
    );
    if (fromSnapshot.length > 0) {
      ids = [...fromSnapshot];
    } else {
      const lat = booking.siteLat;
      const lng = booking.siteLng;
      if (
        lat != null &&
        lng != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        booking.estimateSnapshot
      ) {
        const job = parseEstimateJobMatchFields({
          outputJson: booking.estimateSnapshot.outputJson,
          inputJson: booking.estimateSnapshot.inputJson,
        });
        if (job) {
          const input: JobMatchInput = {
            lat,
            lng,
            squareFootage: job.squareFootage,
            estimatedLaborMinutes: job.estimatedLaborMinutes,
            recommendedTeamSize: job.recommendedTeamSize,
            limit: MAX_FO_CANDIDATES,
          };
          const matched = await this.fo.matchFOs(input);
          ids = matched.map((m) => m.id).filter(Boolean);
        }
      }
    }

    return ids.slice(0, MAX_FO_CANDIDATES);
  }

  /**
   * Walks candidates in backend rank order; keeps first `limit` that can accept bookings.
   */
  private async buildRankedTeamOptions(
    candidateIds: string[],
    limit: number,
  ): Promise<PublicBookingTeamOption[]> {
    const chosen: string[] = [];
    for (const id of candidateIds) {
      const eligibility = await this.fo.getEligibility(id);
      if (!eligibility.canAcceptBooking) continue;
      chosen.push(id);
      if (chosen.length >= limit) break;
    }
    if (chosen.length === 0) return [];

    const rows = await this.prisma.franchiseOwner.findMany({
      where: { id: { in: chosen } },
      select: { id: true, displayName: true },
    });
    const labelById = new Map(
      rows.map((r) => [
        r.id,
        String(r.displayName ?? "").trim() || "Team",
      ] as const),
    );

    return chosen.map((id, index) => ({
      id,
      displayName: labelById.get(id) ?? "Team",
      isRecommended: index === 0,
    }));
  }

  private resolveAvailabilityRange(
    dto: PublicAvailabilityQueryDto,
  ): { rangeStart: Date; rangeEnd: Date } {
    if ((dto.rangeStart && !dto.rangeEnd) || (!dto.rangeStart && dto.rangeEnd)) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_RANGE_INCOMPLETE",
        "Provide both rangeStart and rangeEnd, or use preferredDate / defaults instead.",
      );
    }

    if (dto.rangeStart && dto.rangeEnd) {
      const rangeStart = new Date(dto.rangeStart);
      const rangeEnd = new Date(dto.rangeEnd);
      if (
        !Number.isFinite(rangeStart.getTime()) ||
        !Number.isFinite(rangeEnd.getTime())
      ) {
        this.throwOrchestrator(
          "PUBLIC_BOOKING_RANGE_INVALID",
          "rangeStart and rangeEnd must be valid ISO-8601 datetimes.",
        );
      }
      if (!(rangeEnd.getTime() > rangeStart.getTime())) {
        this.throwOrchestrator(
          "PUBLIC_BOOKING_RANGE_ORDER",
          "rangeEnd must be after rangeStart.",
        );
      }
      return { rangeStart, rangeEnd };
    }

    if (dto.preferredDate) {
      const [y, m, d] = dto.preferredDate.split("-").map((x) => parseInt(x, 10));
      if (!y || !m || !d) {
        this.throwOrchestrator(
          "PUBLIC_BOOKING_PREFERRED_DATE_INVALID",
          "preferredDate must be YYYY-MM-DD.",
        );
      }
      const rangeStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      const rangeEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      return { rangeStart, rangeEnd };
    }

    const rangeStart = new Date();
    rangeStart.setUTCHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + DEFAULT_RANGE_DAYS);
    return { rangeStart, rangeEnd };
  }

  async availability(dto: PublicAvailabilityQueryDto) {
    const booking = await this.loadBookingForOrchestration(dto.bookingId);
    if (!booking) {
      throw new NotFoundException("PUBLIC_BOOKING_NOT_FOUND");
    }

    const teamOptionsError = (
      code: string,
      message: string,
    ): {
      kind: "public_booking_team_options";
      bookingId: string;
      teams: PublicBookingTeamOption[];
      selectionRequired: true;
      unavailableReason: { code: string; message: string };
    } => ({
      kind: "public_booking_team_options" as const,
      bookingId: booking.id,
      teams: [],
      selectionRequired: true as const,
      unavailableReason: { code, message },
    });

    try {
      this.assertSchedulableForAvailability(booking);
    } catch (e) {
      if (e instanceof BadRequestException) {
        const resp = e.getResponse();
        const code =
          typeof resp === "object" &&
          resp !== null &&
          "code" in resp &&
          typeof (resp as { code: unknown }).code === "string"
            ? (resp as { code: string }).code
            : "PUBLIC_BOOKING_UNAVAILABLE";
        const message =
          typeof resp === "object" &&
          resp !== null &&
          "message" in resp &&
          typeof (resp as { message: unknown }).message === "string"
            ? (resp as { message: string }).message
            : e.message;
        return teamOptionsError(code, message);
      }
      throw e;
    }

    const durationMinutes = this.durationMinutesFromBooking(booking);
    const candidateIds = await this.resolveFoCandidateIds(booking);

    if (candidateIds.length === 0) {
      return teamOptionsError(
        "PUBLIC_BOOKING_NO_FO_CANDIDATES",
        "No teams are available for this booking yet. Set site location on the booking or complete dispatch matching first.",
      );
    }

    const foIdParam = dto.foId?.trim();

    if (!foIdParam) {
      const teams = await this.buildRankedTeamOptions(candidateIds, 2);
      if (teams.length === 0) {
        return teamOptionsError(
          "PUBLIC_BOOKING_NO_ELIGIBLE_TEAMS",
          "No eligible teams are available to schedule this booking right now.",
        );
      }
      return {
        kind: "public_booking_team_options" as const,
        bookingId: booking.id,
        teams,
        selectionRequired: true as const,
      };
    }

    if (!candidateIds.includes(foIdParam)) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_FO_NOT_ALLOWED",
        "The selected team is not available for this booking.",
      );
    }

    const eligibility = await this.fo.getEligibility(foIdParam);
    if (!eligibility.canAcceptBooking) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_FO_NOT_ELIGIBLE",
        "The selected team cannot accept bookings at this time.",
      );
    }

    const { rangeStart, rangeEnd } = this.resolveAvailabilityRange(dto);

    const foRow = await this.prisma.franchiseOwner.findUnique({
      where: { id: foIdParam },
      select: { id: true, displayName: true },
    });
    const displayName =
      String(foRow?.displayName ?? "").trim() || "Team";

    const rawWindows = await this.slotAvailability.listAvailableWindows({
      foId: foIdParam,
      rangeStart,
      rangeEnd,
      durationMinutes,
    });

    const windows: PublicBookingWindow[] = rawWindows.map((w) => ({
      foId: foIdParam,
      foDisplayName: displayName,
      startAt: w.startAt.toISOString(),
      endAt: w.endAt.toISOString(),
    }));

    const capped = windows.slice(0, MAX_WINDOWS_TOTAL);

    if (capped.length === 0) {
      return {
        kind: "public_booking_team_availability" as const,
        bookingId: booking.id,
        selectedTeam: { id: foIdParam, displayName },
        windows: capped,
        unavailableReason: {
          code: "PUBLIC_BOOKING_NO_WINDOWS",
          message: "No open times were found for this team in the selected range.",
        },
      };
    }

    return {
      kind: "public_booking_team_availability" as const,
      bookingId: booking.id,
      selectedTeam: { id: foIdParam, displayName },
      windows: capped,
    };
  }

  private async assertWindowMatchesAvailability(args: {
    foId: string;
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
  }) {
    const padMs = 5 * 60 * 1000;
    const rangeStart = new Date(args.startAt.getTime() - padMs);
    const rangeEnd = new Date(args.endAt.getTime() + padMs);
    const windows = await this.slotAvailability.listAvailableWindows({
      foId: args.foId,
      rangeStart,
      rangeEnd,
      durationMinutes: args.durationMinutes,
    });
    const match = windows.some(
      (w) =>
        w.startAt.getTime() === args.startAt.getTime() &&
        w.endAt.getTime() === args.endAt.getTime(),
    );
    if (!match) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
        "The requested window is not currently offered as available for this franchise owner.",
      );
    }
  }

  async createHold(dto: PublicSlotSelectDto) {
    const booking = await this.loadBookingForOrchestration(dto.bookingId);
    if (!booking) {
      throw new NotFoundException("PUBLIC_BOOKING_NOT_FOUND");
    }

    this.assertSchedulableForAvailability(booking);

    const foIds = await this.resolveFoCandidateIds(booking);
    if (!foIds.includes(dto.foId)) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_FO_NOT_ALLOWED",
        "The selected franchise owner is not a candidate for this booking.",
      );
    }

    const durationMinutes = this.durationMinutesFromBooking(booking);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_SLOT_TIME_INVALID",
        "startAt and endAt must be valid ISO-8601 datetimes.",
      );
    }

    const holdDuration = Math.round(
      (endAt.getTime() - startAt.getTime()) / (60 * 1000),
    );
    if (holdDuration !== durationMinutes) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_SLOT_DURATION_MISMATCH",
        `Hold duration must match the booking estimate (${durationMinutes} minutes).`,
      );
    }

    await this.assertWindowMatchesAvailability({
      foId: dto.foId,
      startAt,
      endAt,
      durationMinutes,
    });

    const hold = await this.slotHolds.createHold({
      bookingId: dto.bookingId,
      foId: dto.foId,
      startAt: dto.startAt,
      endAt: dto.endAt,
    });

    await this.prisma.booking.update({
      where: { id: dto.bookingId },
      data: { preferredFoId: dto.foId.trim() },
    });

    return {
      kind: "public_booking_hold" as const,
      bookingId: dto.bookingId,
      holdId: hold.id,
      expiresAt: hold.expiresAt.toISOString(),
      window: {
        foId: hold.foId,
        startAt: hold.startAt.toISOString(),
        endAt: hold.endAt.toISOString(),
      },
    };
  }

  async confirmHold(
    dto: PublicSlotConfirmDto,
    idempotencyKey: string | null | undefined,
  ) {
    const booking = await this.loadBookingForOrchestration(dto.bookingId);
    if (!booking) {
      throw new NotFoundException("PUBLIC_BOOKING_NOT_FOUND");
    }

    const hold = await this.prisma.bookingSlotHold.findUnique({
      where: { id: dto.holdId },
    });
    if (!hold || hold.bookingId !== dto.bookingId) {
      throw new NotFoundException("PUBLIC_BOOKING_HOLD_NOT_FOUND");
    }

    const result = await this.bookings.confirmBookingFromHold({
      bookingId: dto.bookingId,
      holdId: dto.holdId,
      note: dto.note,
      idempotencyKey: idempotencyKey?.trim() || null,
    });

    const scheduledStart = result.scheduledStart
      ? new Date(result.scheduledStart).toISOString()
      : null;
    const scheduledEnd =
      result.scheduledStart && Number(result.estimatedHours) > 0
        ? new Date(
            new Date(result.scheduledStart).getTime() +
              Number(result.estimatedHours) * 60 * 60 * 1000,
          ).toISOString()
        : null;

    return {
      kind: "public_booking_confirmation" as const,
      bookingId: result.id,
      scheduledStart,
      scheduledEnd,
      status: result.status,
      alreadyApplied: Boolean(
        (result as { alreadyApplied?: boolean }).alreadyApplied,
      ),
    };
  }
}
