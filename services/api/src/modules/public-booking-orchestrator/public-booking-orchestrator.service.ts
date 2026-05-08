import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { BookingRecoveryStatus, BookingStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { FoService, type JobMatchInput } from "../fo/fo.service";
import {
  parseEstimateJobMatchFields,
  type EstimateJobMatchFields,
} from "../crew-capacity/parse-estimate-job-match-fields";
import {
  clampCrewSizeForService,
  getServiceMaxCrewSize,
} from "../crew-capacity/crew-capacity-policy";
import { resolveFranchiseOwnerCrewRange } from "../crew-capacity/franchise-owner-crew-range";
import {
  MIN_DURATION_MINUTES,
  computeAssignedCrewSize,
  computeElapsedDurationMinutesFromLabor,
} from "../crew-capacity/assigned-crew-and-duration";
import { getWorkloadMinCrew } from "../crew-capacity/workload-min-crew";
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
import { publicBookingFixtureFoEmails } from "../../dev/publicBookingFoFixtures";
import { PublicBookingDepositService } from "./public-booking-deposit.service";
import { resolveCanonicalBookingScheduledEnd } from "../bookings/booking-scheduled-window";
import {
  decodePublicSlotId,
  encodePublicSlotId,
} from "../slot-holds/public-slot-id";
import { RecurringPlanService } from "../recurring-plan/recurring-plan.service";

const MAX_FO_CANDIDATES = 8;
const MAX_WINDOWS_TOTAL = 60;
const DEFAULT_RANGE_DAYS = 14;
const PUBLIC_BOOKING_HOLD_ANOMALY_CODES = new Set([
  "PUBLIC_BOOKING_INVALID_SLOT_ID",
  "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
  "PUBLIC_BOOKING_SLOT_IN_PAST",
]);
const PUBLIC_BOOKING_CONFIRM_ANOMALY_CODES = new Set([
  "PUBLIC_BOOKING_HOLD_EXPIRED",
  "PUBLIC_BOOKING_HOLD_NOT_FOUND",
  "PUBLIC_BOOKING_SLOT_IN_PAST",
  "PUBLIC_BOOKING_DEPOSIT_UNRESOLVED",
  "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
  "BOOKING_SLOT_HOLD_EXPIRED",
  "FO_SLOT_ALREADY_BOOKED",
  "FO_NOT_AVAILABLE_AT_SCHEDULED_TIME",
]);

type BookingForOrchestration = {
  id: string;
  status: BookingStatus;
  foId: string | null;
  preferredFoId: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  estimatedHours: number;
  siteLat: number | null;
  siteLng: number | null;
  estimateSnapshot: { outputJson: string; inputJson: string } | null;
};

type RecoveryFailureReason =
  | "HOLD_EXPIRED"
  | "SLOT_TAKEN"
  | "FO_UNAVAILABLE"
  | "NO_RECOVERY_AVAILABLE";

type RecoveryConfirmResult = {
  result: {
    id: string;
    scheduledStart: Date | string | null;
    estimatedHours: number;
    status: BookingStatus;
    alreadyApplied?: boolean;
  };
  hold: {
    id: string;
    foId: string;
    startAt: Date;
    endAt: Date;
  };
  autoAdjusted: boolean;
};

function extractFoIdsFromEstimateOutput(outputJson: string | null): string[] {
  if (!outputJson?.trim()) return [];
  try {
    const o = JSON.parse(outputJson) as Record<string, unknown>;
    /** Prefer full dispatch rank order; `matchedCleaners` is only the top slice. */
    const pools = [o.dispatchCandidatePool, o.matchedCleaners];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const p of pools) {
      if (!Array.isArray(p)) continue;
      for (const item of p) {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as { id?: unknown }).id === "string"
        ) {
          const id = String((item as { id: string }).id);
          if (seen.has(id)) continue;
          seen.add(id);
          ids.push(id);
        }
      }
    }
    return ids;
  } catch {
    return [];
  }
}

@Injectable()
export class PublicBookingOrchestratorService {
  private readonly log = new Logger(PublicBookingOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slotAvailability: SlotAvailabilityService,
    private readonly slotHolds: SlotHoldsService,
    private readonly bookings: BookingsService,
    private readonly fo: FoService,
    private readonly publicBookingDeposit: PublicBookingDepositService,
    private readonly recurringPlans?: RecurringPlanService,
  ) {}

  private throwOrchestrator(code: string, message: string): never {
    throw new BadRequestException({ code, message });
  }

  private throwPastPublicSlot(): never {
    throw new ConflictException({
      code: "PUBLIC_BOOKING_SLOT_IN_PAST",
      message:
        "Selected arrival time is no longer available. Please choose a future time.",
    });
  }

  private logLifecycle(event: Record<string, unknown>) {
    this.log.log({
      kind: "public_booking_lifecycle",
      ...event,
    });
  }

  private async autoCreateRecurringPlanAfterDeposit(bookingId: string) {
    if (!this.recurringPlans) return;
    try {
      await this.recurringPlans.autoCreateFromBookingAfterDeposit({ bookingId });
    } catch (error) {
      this.log.warn({
        event: "recurring_plan_auto_create_after_deposit",
        bookingId,
        result: "failed",
        reason: error instanceof Error ? error.message : String(error ?? "unknown"),
      });
    }
  }

  private codeFromError(err: unknown, fallback: string): string {
    if (err && typeof err === "object" && "getResponse" in err) {
      const getResponse = (err as { getResponse?: unknown }).getResponse;
      const response =
        typeof getResponse === "function" ? getResponse.call(err) : null;
      if (
        response &&
        typeof response === "object" &&
        "code" in response &&
        typeof (response as { code?: unknown }).code === "string"
      ) {
        return (response as { code: string }).code;
      }
      if (
        response &&
        typeof response === "object" &&
        "message" in response &&
        typeof (response as { message?: unknown }).message === "string" &&
        (response as { message: string }).message.trim()
      ) {
        return (response as { message: string }).message.trim();
      }
      if (typeof response === "string" && response.trim()) return response.trim();
    }
    return fallback;
  }

  private async recordLifecycleAnomaly(args: {
    bookingId?: string | null;
    kind: "public_booking_hold_failed" | "public_booking_deposit_failed" | "public_booking_confirm_failed";
    severity?: "info" | "warning" | "critical";
    message: string;
    details: Record<string, unknown>;
  }) {
    if (!this.prisma.paymentAnomaly?.create) return;
    try {
      await this.prisma.paymentAnomaly.create({
        data: {
          bookingId: args.bookingId?.trim() || undefined,
          kind: args.kind,
          severity: args.severity ?? "warning",
          status: "open",
          message: args.message,
          details: args.details as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.log.error({
        kind: "public_booking_lifecycle",
        event: "anomaly_record_failed",
        anomalyKind: args.kind,
        bookingId: args.bookingId ?? null,
        message: err instanceof Error ? err.message : String(err),
      });
    }
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
        scheduledEnd: true,
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
      scheduledEnd: row.scheduledEnd,
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
    return Math.max(
      MIN_DURATION_MINUTES,
      Math.round(booking.estimatedHours * 60),
    );
  }

  private resolveRequiredLaborMinutes(
    booking: BookingForOrchestration,
    jobMatch: EstimateJobMatchFields | null,
  ): number {
    if (jobMatch && jobMatch.estimatedLaborMinutes > 0) {
      return jobMatch.estimatedLaborMinutes;
    }
    return Math.max(1, Math.round(booking.estimatedHours * 60));
  }

  private async computeSlotDurationMinutesForFo(
    booking: BookingForOrchestration,
    foId: string,
    jobMatch: EstimateJobMatchFields | null,
  ): Promise<number> {
    if (!jobMatch) {
      return this.durationMinutesFromBooking(booking);
    }
    const labor = this.resolveRequiredLaborMinutes(booking, jobMatch);
    const fo = await this.prisma.franchiseOwner.findUnique({
      where: { id: foId },
      select: {
        teamSize: true,
        minCrewSize: true,
        preferredCrewSize: true,
        maxCrewSize: true,
      },
    });
    if (!fo) {
      return this.durationMinutesFromBooking(booking);
    }
    const crew = resolveFranchiseOwnerCrewRange(fo);
    const normRec = clampCrewSizeForService(
      jobMatch.serviceType,
      jobMatch.serviceSegment,
      jobMatch.recommendedTeamSize,
    );
    const workloadMinCrew = getWorkloadMinCrew({
      estimatedLaborMinutes: labor,
      squareFootage: jobMatch.squareFootage ?? 1500,
      serviceType: jobMatch.serviceType,
    });
    const assigned = computeAssignedCrewSize({
      serviceType: jobMatch.serviceType,
      serviceSegment: jobMatch.serviceSegment,
      normalizedRecommendedCrewSize: normRec,
      candidate: crew,
      workloadMinCrew,
    });
    return computeElapsedDurationMinutesFromLabor(labor, assigned);
  }

  /**
   * Dev-only public-booking FO fixtures (`seed:public-booking-fo-fixtures`) share the same
   * Tulsa hub as matrix cohorts; they are not a production cohort. When live `matchFOs`
   * returns other candidates, drop fixtures so scheduling reflects current eligibility +
   * ranking rather than a frozen estimate snapshot.
   */
  private async preferNonFixtureFoIds(orderedIds: string[]): Promise<string[]> {
    if (orderedIds.length === 0) return [];
    const fixtureEmailSet = new Set<string>(
      Object.values(publicBookingFixtureFoEmails) as string[],
    );
    const rows = await this.prisma.franchiseOwner.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true, user: { select: { email: true } } },
    });
    const emailById = new Map(
      rows.map((r) => [r.id, String(r.user?.email ?? "").trim()] as const),
    );
    const withoutFixtures = orderedIds.filter(
      (id) => !fixtureEmailSet.has(emailById.get(id) ?? ""),
    );
    return withoutFixtures.length > 0 ? withoutFixtures : orderedIds;
  }

  private async resolveFoCandidateIds(
    booking: BookingForOrchestration,
  ): Promise<string[]> {
    if (booking.foId?.trim()) {
      return [booking.foId.trim()];
    }

    const fromSnapshot = extractFoIdsFromEstimateOutput(
      booking.estimateSnapshot?.outputJson ?? null,
    );

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
          serviceType: job.serviceType,
          serviceSegment: job.serviceSegment,
          limit: MAX_FO_CANDIDATES,
          bookingMatchMode: "public_one_time",
        };
        const matched = await this.fo.matchFOs(input);
        const liveIds = matched.map((m) => m.id).filter(Boolean);
        if (liveIds.length > 0) {
          const ranked = await this.preferNonFixtureFoIds(liveIds);
          return ranked.slice(0, MAX_FO_CANDIDATES);
        }
      }
    }

    return fromSnapshot.slice(0, MAX_FO_CANDIDATES);
  }

  /**
   * Walks candidates in backend rank order; keeps first `limit` that can accept bookings.
   */
  private async buildRankedTeamOptions(
    booking: BookingForOrchestration,
    candidateIds: string[],
    limit: number,
    jobMatch: EstimateJobMatchFields | null,
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
      select: {
        id: true,
        displayName: true,
        teamSize: true,
        minCrewSize: true,
        preferredCrewSize: true,
        maxCrewSize: true,
      },
    });
    const labelById = new Map(
      rows.map((r) => [
        r.id,
        String(r.displayName ?? "").trim() || "Team",
      ] as const),
    );

    const labor = this.resolveRequiredLaborMinutes(booking, jobMatch);

    return chosen.map((id, index) => {
      const row = rows.find((r) => r.id === id);
      const crew = row
        ? resolveFranchiseOwnerCrewRange(row)
        : resolveFranchiseOwnerCrewRange({
            teamSize: null,
            minCrewSize: null,
            preferredCrewSize: null,
            maxCrewSize: null,
          });
      const segment = jobMatch?.serviceSegment ?? "residential";
      const serviceType = jobMatch?.serviceType ?? "maintenance";
      const normRec = jobMatch
        ? clampCrewSizeForService(serviceType, segment, jobMatch.recommendedTeamSize)
        : 1;
      const workloadMinCrew = getWorkloadMinCrew({
        estimatedLaborMinutes: labor,
        squareFootage: jobMatch?.squareFootage ?? 1500,
        serviceType,
      });
      const assignedCrewSize = computeAssignedCrewSize({
        serviceType,
        serviceSegment: segment,
        normalizedRecommendedCrewSize: normRec,
        candidate: crew,
        workloadMinCrew,
      });
      const estimatedDurationMinutes = computeElapsedDurationMinutesFromLabor(
        labor,
        assignedCrewSize,
      );
      const serviceMaxCrewSize = getServiceMaxCrewSize(serviceType, segment);

      return {
        id,
        displayName: labelById.get(id) ?? "Team",
        isRecommended: index === 0,
        assignedCrewSize,
        estimatedDurationMinutes,
        crewCapacityMeta: {
          requiredLaborMinutes: labor,
          recommendedCrewSize: jobMatch?.recommendedTeamSize ?? null,
          assignedCrewSize,
          serviceMaxCrewSize,
          serviceSegment: segment,
        },
      };
    });
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
    } => {
      this.logLifecycle({
        event: "availability_result",
        bookingId: booking.id,
        teamCount: 0,
        windowCount: 0,
        unavailableReasonCode: code,
      });
      return {
        kind: "public_booking_team_options" as const,
        bookingId: booking.id,
        teams: [],
        selectionRequired: true as const,
        unavailableReason: { code, message },
      };
    };

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

    const candidateIds = await this.resolveFoCandidateIds(booking);
    const jobMatch =
      booking.estimateSnapshot?.outputJson &&
      booking.estimateSnapshot?.inputJson
        ? parseEstimateJobMatchFields({
            outputJson: booking.estimateSnapshot.outputJson,
            inputJson: booking.estimateSnapshot.inputJson,
          })
        : null;
    const teamOptionsLimit =
      jobMatch?.serviceType === "move_in" || jobMatch?.serviceType === "move_out"
        ? 3
        : jobMatch?.serviceType === "deep_clean"
          ? 3
          : 2;

    if (candidateIds.length === 0) {
      const hasRoutableSite =
        booking.siteLat != null &&
        booking.siteLng != null &&
        Number.isFinite(booking.siteLat) &&
        Number.isFinite(booking.siteLng);
      if (!hasRoutableSite) {
        return teamOptionsError(
          "PUBLIC_BOOKING_LOCATION_NOT_RESOLVED",
          "We could not confirm a routable map location for this address yet. Please go back, double-check your service address, and try again.",
        );
      }
      return teamOptionsError(
        "PUBLIC_BOOKING_NO_FO_CANDIDATES",
        "No teams are available to schedule online for this area right now. You can still save your request—we’ll follow up by email with next steps.",
      );
    }

    const foIdParam = dto.foId?.trim();

    if (!foIdParam) {
      const teams = await this.buildRankedTeamOptions(
        booking,
        candidateIds,
        teamOptionsLimit,
        jobMatch,
      );
      if (teams.length === 0) {
        return teamOptionsError(
          "PUBLIC_BOOKING_NO_ELIGIBLE_TEAMS",
          "No eligible teams are available to schedule this booking right now.",
        );
      }
      this.logLifecycle({
        event: "availability_result",
        bookingId: booking.id,
        serviceType: jobMatch?.serviceType ?? null,
        teamCount: teams.length,
        windowCount: 0,
      });
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
      select: {
        id: true,
        displayName: true,
        teamSize: true,
        minCrewSize: true,
        preferredCrewSize: true,
        maxCrewSize: true,
      },
    });
    const displayName =
      String(foRow?.displayName ?? "").trim() || "Team";

    const durationMinutes = await this.computeSlotDurationMinutesForFo(
      booking,
      foIdParam,
      jobMatch,
    );

    const crew = foRow
      ? resolveFranchiseOwnerCrewRange(foRow)
      : resolveFranchiseOwnerCrewRange({
          teamSize: null,
          minCrewSize: null,
          preferredCrewSize: null,
          maxCrewSize: null,
        });
    const segment = jobMatch?.serviceSegment ?? "residential";
    const serviceType = jobMatch?.serviceType ?? "maintenance";
    const labor = this.resolveRequiredLaborMinutes(booking, jobMatch);
    const normRec = jobMatch
      ? clampCrewSizeForService(serviceType, segment, jobMatch.recommendedTeamSize)
      : 1;
    const workloadMinCrew = getWorkloadMinCrew({
      estimatedLaborMinutes: labor,
      squareFootage: jobMatch?.squareFootage ?? 1500,
      serviceType,
    });
    const assignedCrewForSlot = computeAssignedCrewSize({
      serviceType,
      serviceSegment: segment,
      normalizedRecommendedCrewSize: normRec,
      candidate: crew,
      workloadMinCrew,
    });

    const rawWindows = await this.slotAvailability.listAvailableWindows({
      foId: foIdParam,
      rangeStart,
      rangeEnd,
      durationMinutes,
    });

    const windows: PublicBookingWindow[] = rawWindows.map((w) => ({
      slotId: encodePublicSlotId({
        foId: foIdParam,
        startAt: w.startAt,
        endAt: w.endAt,
        durationMinutes,
      }),
      foId: foIdParam,
      foDisplayName: displayName,
      startAt: w.startAt.toISOString(),
      endAt: w.endAt.toISOString(),
      durationMinutes,
    }));

    const capped = windows.slice(0, MAX_WINDOWS_TOTAL);

    if (capped.length === 0) {
      this.logLifecycle({
        event: "availability_result",
        bookingId: booking.id,
        serviceType,
        teamCount: 1,
        windowCount: 0,
        unavailableReasonCode: "PUBLIC_BOOKING_NO_WINDOWS",
      });
      return {
        kind: "public_booking_team_availability" as const,
        bookingId: booking.id,
        selectedTeam: {
          id: foIdParam,
          displayName,
          assignedCrewSize: assignedCrewForSlot,
          estimatedDurationMinutes: durationMinutes,
          crewCapacityMeta: {
            requiredLaborMinutes: labor,
            recommendedCrewSize: jobMatch?.recommendedTeamSize ?? null,
            assignedCrewSize: assignedCrewForSlot,
            serviceMaxCrewSize: getServiceMaxCrewSize(serviceType, segment),
            serviceSegment: segment,
          },
        },
        windows: capped,
        unavailableReason: {
          code: "PUBLIC_BOOKING_NO_WINDOWS",
          message: "No open times were found for this team in the selected range.",
        },
      };
    }

    this.logLifecycle({
      event: "availability_result",
      bookingId: booking.id,
      serviceType,
      teamCount: 1,
      windowCount: capped.length,
    });

    return {
      kind: "public_booking_team_availability" as const,
      bookingId: booking.id,
      selectedTeam: {
        id: foIdParam,
        displayName,
        assignedCrewSize: assignedCrewForSlot,
        estimatedDurationMinutes: durationMinutes,
        crewCapacityMeta: {
          requiredLaborMinutes: labor,
          recommendedCrewSize: jobMatch?.recommendedTeamSize ?? null,
          assignedCrewSize: assignedCrewForSlot,
          serviceMaxCrewSize: getServiceMaxCrewSize(serviceType, segment),
          serviceSegment: segment,
        },
      },
      windows: capped,
    };
  }

  private async assertWindowMatchesAvailability(args: {
    bookingId: string;
    foId: string;
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    slotId?: string | null;
  }) {
    /**
     * Match the default range used when the web client loads slots:
     * `postPublicBookingAvailability({ bookingId, foId })` sends no preferredDate
     * or custom range, so `resolveAvailabilityRange` uses the 14-day UTC-midnight
     * window. Re-querying with a tight band around the slot can miss the same
     * window set the UI listed.
     */
    const { rangeStart, rangeEnd } = this.resolveAvailabilityRange({
      bookingId: args.bookingId,
    });
    const windows = await this.slotAvailability.listAvailableWindows({
      foId: args.foId,
      rangeStart,
      rangeEnd,
      durationMinutes: args.durationMinutes,
    });
    const match = windows.some((w) => {
      return (
        w.startAt.getTime() === args.startAt.getTime() &&
        w.endAt.getTime() === args.endAt.getTime()
      );
    });
    if (!match) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
        "The requested window is not currently offered as available.",
      );
    }
  }

  private classifyFinalizationFailure(err: unknown): RecoveryFailureReason | null {
    const response =
      err instanceof BadRequestException ||
      err instanceof ConflictException ||
      err instanceof NotFoundException
        ? err.getResponse()
        : null;
    const responseCode =
      response && typeof response === "object" && "code" in response
        ? String((response as { code?: unknown }).code ?? "")
        : "";
    const message =
      err instanceof Error ? err.message : typeof response === "string" ? response : "";
    const marker = `${responseCode} ${message}`;
    if (marker.includes("BOOKING_SLOT_HOLD_EXPIRED")) return "HOLD_EXPIRED";
    if (
      marker.includes("FO_SLOT_ALREADY_BOOKED") ||
      marker.includes("PUBLIC_BOOKING_SLOT_NOT_AVAILABLE")
    ) {
      return "SLOT_TAKEN";
    }
    if (
      marker.includes("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME") ||
      marker.includes("FO_NOT_ELIGIBLE")
    ) {
      return "FO_UNAVAILABLE";
    }
    return null;
  }

  private sameUtcDayRange(anchor: Date): { rangeStart: Date; rangeEnd: Date } {
    const rangeStart = new Date(anchor);
    rangeStart.setUTCHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart.getTime() + 24 * 60 * 60 * 1000);
    return { rangeStart, rangeEnd };
  }

  private sortWindowsNearestFirst<T extends { startAt: Date }>(
    windows: T[],
    target: Date,
  ): T[] {
    const targetMs = target.getTime();
    return [...windows].sort(
      (a, b) =>
        Math.abs(a.startAt.getTime() - targetMs) -
        Math.abs(b.startAt.getTime() - targetMs),
    );
  }

  private async listRecoveryWindows(args: {
    booking: BookingForOrchestration;
    foId: string;
    durationMinutes: number;
    originalStart: Date;
    sameDayOnly: boolean;
  }) {
    const range = args.sameDayOnly
      ? this.sameUtcDayRange(args.originalStart)
      : this.resolveAvailabilityRange({ bookingId: args.booking.id });
    return this.slotAvailability.listAvailableWindows({
      foId: args.foId,
      rangeStart: range.rangeStart,
      rangeEnd: range.rangeEnd,
      durationMinutes: args.durationMinutes,
    });
  }

  private async confirmRecoveredWindow(args: {
    booking: BookingForOrchestration;
    foId: string;
    startAt: Date;
    endAt: Date;
    originalHold: { id: string; foId: string; startAt: Date; endAt: Date };
    note?: string;
    idempotencyKey: string | null;
    recoveryAttemptedAt: Date;
  }): Promise<RecoveryConfirmResult | null> {
    let hold: Awaited<ReturnType<SlotHoldsService["createHold"]>>;
    try {
      hold = await this.slotHolds.createHold({
        bookingId: args.booking.id,
        foId: args.foId,
        startAt: args.startAt.toISOString(),
        endAt: args.endAt.toISOString(),
      });
    } catch {
      return null;
    }

    try {
      const result = await this.bookings.confirmBookingFromHold({
        bookingId: args.booking.id,
        holdId: hold.id,
        note: args.note,
        idempotencyKey: args.idempotencyKey,
        useHoldElapsedDurationModel: true,
      });
      const autoAdjusted =
        args.foId !== args.originalHold.foId ||
        args.startAt.getTime() !== args.originalHold.startAt.getTime() ||
        args.endAt.getTime() !== args.originalHold.endAt.getTime();
      await this.prisma.booking.update({
        where: { id: args.booking.id },
        data: {
          recoveryStatus: autoAdjusted
            ? BookingRecoveryStatus.auto_adjusted
            : BookingRecoveryStatus.none,
          originalRequestedTime: args.originalHold.startAt,
          recoveryAttemptedAt: args.recoveryAttemptedAt,
          ...(autoAdjusted ? { preferredFoId: args.foId } : {}),
        },
      });
      return {
        result,
        hold: {
          id: hold.id,
          foId: hold.foId,
          startAt: hold.startAt,
          endAt: hold.endAt,
        },
        autoAdjusted,
      };
    } catch {
      return null;
    }
  }

  private async attemptPostPaymentRecovery(args: {
    booking: BookingForOrchestration;
    originalHold: { id: string; bookingId: string; foId: string; startAt: Date; endAt: Date };
    note?: string;
    idempotencyKey: string | null;
  }): Promise<RecoveryConfirmResult | null> {
    const recoveryAttemptedAt = new Date();
    const jobMatch =
      args.booking.estimateSnapshot?.outputJson &&
      args.booking.estimateSnapshot?.inputJson
        ? parseEstimateJobMatchFields({
            outputJson: args.booking.estimateSnapshot.outputJson,
            inputJson: args.booking.estimateSnapshot.inputJson,
          })
        : null;
    const candidateIds = await this.resolveFoCandidateIds(args.booking);
    const orderedFoIds = [
      args.originalHold.foId,
      ...candidateIds.filter((id) => id !== args.originalHold.foId),
    ];

    const originalDuration = Math.round(
      (args.originalHold.endAt.getTime() - args.originalHold.startAt.getTime()) /
        (60 * 1000),
    );
    if (originalDuration <= 0) return null;

    const originalFoWindows = await this.listRecoveryWindows({
      booking: args.booking,
      foId: args.originalHold.foId,
      durationMinutes: originalDuration,
      originalStart: args.originalHold.startAt,
      sameDayOnly: false,
    });
    const originalAvailable = originalFoWindows.some(
      (w) =>
        w.startAt.getTime() === args.originalHold.startAt.getTime() &&
        w.endAt.getTime() === args.originalHold.endAt.getTime(),
    );
    if (originalAvailable) {
      const recovered = await this.confirmRecoveredWindow({
        booking: args.booking,
        foId: args.originalHold.foId,
        startAt: args.originalHold.startAt,
        endAt: args.originalHold.endAt,
        originalHold: args.originalHold,
        note: args.note,
        idempotencyKey: args.idempotencyKey,
        recoveryAttemptedAt,
      });
      if (recovered) return recovered;
    }

    for (const sameDayOnly of [true, false]) {
      for (const foId of orderedFoIds) {
        const durationMinutes = await this.computeSlotDurationMinutesForFo(
          args.booking,
          foId,
          jobMatch,
        );
        const windows = await this.listRecoveryWindows({
          booking: args.booking,
          foId,
          durationMinutes,
          originalStart: args.originalHold.startAt,
          sameDayOnly,
        });
        for (const w of this.sortWindowsNearestFirst(windows, args.originalHold.startAt)) {
          if (
            w.startAt.getTime() === args.originalHold.startAt.getTime() &&
            w.endAt.getTime() === args.originalHold.endAt.getTime() &&
            foId === args.originalHold.foId
          ) {
            continue;
          }
          const recovered = await this.confirmRecoveredWindow({
            booking: args.booking,
            foId,
            startAt: w.startAt,
            endAt: w.endAt,
            originalHold: args.originalHold,
            note: args.note,
            idempotencyKey: args.idempotencyKey,
            recoveryAttemptedAt,
          });
          if (recovered) return recovered;
        }
      }
    }

    await this.prisma.booking.update({
      where: { id: args.booking.id },
      data: {
        recoveryStatus: BookingRecoveryStatus.failed,
        originalRequestedTime: args.originalHold.startAt,
        recoveryAttemptedAt,
      },
    });
    return null;
  }

  private async recordPostPaymentRecoveryFailure(args: {
    bookingId: string;
    holdId: string;
    reason: RecoveryFailureReason;
    err: unknown;
  }) {
    await this.prisma.paymentAnomaly.create({
      data: {
        bookingId: args.bookingId,
        kind: "public_deposit_succeeded_booking_finalization_failed",
        severity: "critical",
        status: "open",
        message:
          args.err instanceof Error
            ? args.err.message
            : "Public deposit succeeded but booking finalization failed.",
        details: {
          holdId: args.holdId,
          reason: "PAID_NO_AVAILABLE_SLOT",
          recoveryReason: args.reason,
          structuredReason: "NO_RECOVERY_AVAILABLE",
          code:
            args.err instanceof Error && args.err.message
              ? args.err.message
              : "PUBLIC_BOOKING_FINALIZATION_FAILED",
        } as Prisma.InputJsonValue,
      },
    });
  }

  async createHold(dto: PublicSlotSelectDto) {
    const booking = await this.loadBookingForOrchestration(dto.bookingId);
    if (!booking) {
      throw new NotFoundException("PUBLIC_BOOKING_NOT_FOUND");
    }

    this.assertSchedulableForAvailability(booking);

    const slotIdPresent = Boolean(dto.slotId?.trim());
    const decodedSlot = dto.slotId?.trim()
      ? decodePublicSlotId(dto.slotId)
      : null;
    this.logLifecycle({
      event: "hold_attempt",
      bookingId: dto.bookingId,
      slotIdPresent,
      decodedSlotIdValid: slotIdPresent ? Boolean(decodedSlot) : undefined,
      foId: decodedSlot?.foId ?? undefined,
      startAt: decodedSlot?.startAt ?? undefined,
    });
    if (dto.slotId?.trim() && !decodedSlot) {
      const code = "PUBLIC_BOOKING_INVALID_SLOT_ID";
      this.logLifecycle({
        event: "hold_failed",
        bookingId: dto.bookingId,
        failureCode: code,
        failureStage: "decode_slot_id",
        slotIdPresent,
        decodedSlotIdValid: false,
      });
      await this.recordLifecycleAnomaly({
        bookingId: dto.bookingId,
        kind: "public_booking_hold_failed",
        message: "Public booking hold failed.",
        details: {
          bookingId: dto.bookingId,
          code,
          stage: "decode_slot_id",
          slotIdPresent,
          decodedSlotIdValid: false,
          at: new Date().toISOString(),
        },
      });
      this.throwOrchestrator(
        code,
        "Selected arrival time is no longer valid. Please choose another time.",
      );
    }

    const requestedFoId = decodedSlot?.foId ?? dto.foId?.trim() ?? "";
    const requestedStartAt = decodedSlot?.startAt ?? dto.startAt;
    const requestedEndAt = decodedSlot?.endAt ?? dto.endAt;
    if (!requestedFoId || !requestedStartAt || !requestedEndAt) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_INVALID_SLOT_ID",
        "Selected arrival time is no longer valid. Please choose another time.",
      );
    }

    const foIds = await this.resolveFoCandidateIds(booking);
    if (!foIds.includes(requestedFoId)) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_FO_NOT_ALLOWED",
        "The selected franchise owner is not a candidate for this booking.",
      );
    }

    const jobMatchHold =
      booking.estimateSnapshot?.outputJson &&
      booking.estimateSnapshot?.inputJson
        ? parseEstimateJobMatchFields({
            outputJson: booking.estimateSnapshot.outputJson,
            inputJson: booking.estimateSnapshot.inputJson,
          })
        : null;
    const durationMinutes = await this.computeSlotDurationMinutesForFo(
      booking,
      requestedFoId,
      jobMatchHold,
    );
    const startAt = new Date(requestedStartAt);
    const endAt = new Date(requestedEndAt);
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
        `Hold duration must match the slot model for this team (${durationMinutes} minutes).`,
      );
    }
    if (decodedSlot && decodedSlot.durationMinutes !== durationMinutes) {
      this.throwOrchestrator(
        "PUBLIC_BOOKING_SLOT_DURATION_MISMATCH",
        `Hold duration must match the slot model for this team (${durationMinutes} minutes).`,
      );
    }

    try {
      await this.assertWindowMatchesAvailability({
        bookingId: dto.bookingId,
        foId: requestedFoId,
        startAt,
        endAt,
        durationMinutes,
        slotId: dto.slotId ?? null,
      });

      const hold = await this.slotHolds.createHold({
        bookingId: dto.bookingId,
        foId: requestedFoId,
        startAt,
        endAt,
      });

      await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: { preferredFoId: requestedFoId },
      });

      this.logLifecycle({
        event: "hold_succeeded",
        bookingId: dto.bookingId,
        holdId: hold.id,
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
    } catch (err) {
      const code = this.codeFromError(err, "PUBLIC_BOOKING_HOLD_FAILED");
      const failureStage =
        code === "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE"
          ? "availability_revalidation"
          : code === "PUBLIC_BOOKING_SLOT_IN_PAST"
            ? "create_hold"
            : "create_hold";
      this.logLifecycle({
        event: "hold_failed",
        bookingId: dto.bookingId,
        failureCode: code,
        failureStage,
        slotIdPresent,
        decodedSlotIdValid: slotIdPresent ? Boolean(decodedSlot) : undefined,
      });
      if (PUBLIC_BOOKING_HOLD_ANOMALY_CODES.has(code)) {
        await this.recordLifecycleAnomaly({
          bookingId: dto.bookingId,
          kind: "public_booking_hold_failed",
          message: "Public booking hold failed.",
          details: {
            bookingId: dto.bookingId,
            code,
            stage: failureStage,
            slotIdPresent,
            decodedSlotIdValid: slotIdPresent ? Boolean(decodedSlot) : undefined,
            at: new Date().toISOString(),
          },
        });
      }
      throw err;
    }
  }

  preparePublicDeposit(body: { bookingId: string; holdId?: string | null }) {
    return this.publicBookingDeposit.preparePublicBookingDeposit(
      body.bookingId,
      body.holdId ?? null,
    );
  }

  async confirmHold(
    dto: PublicSlotConfirmDto,
    idempotencyKey: string | null | undefined,
  ) {
    const booking = await this.loadBookingForOrchestration(dto.bookingId);
    if (!booking) {
      throw new NotFoundException("PUBLIC_BOOKING_NOT_FOUND");
    }
    this.logLifecycle({
      event: "confirm_attempt",
      bookingId: dto.bookingId,
      holdIdPresent: Boolean(dto.holdId?.trim()),
    });

    const hold = await this.prisma.bookingSlotHold.findUnique({
      where: { id: dto.holdId },
    });
    if (!hold || hold.bookingId !== dto.bookingId) {
      if (
        booking.status === BookingStatus.assigned &&
        booking.scheduledStart != null
      ) {
        const replayResult = {
          kind: "public_booking_confirmation" as const,
          bookingId: booking.id,
          scheduledStart: booking.scheduledStart.toISOString(),
          scheduledEnd: resolveCanonicalBookingScheduledEnd({
            scheduledStart: booking.scheduledStart,
            scheduledEnd: booking.scheduledEnd,
            estimatedHours: booking.estimatedHours,
            estimateSnapshotOutputJson: booking.estimateSnapshot?.outputJson,
            preferWallClockFromSnapshot: true,
            hold: null,
          })?.toISOString() ?? null,
          status: booking.status,
          alreadyApplied: true,
        };
        this.logLifecycle({
          event: "confirm_succeeded",
          bookingId: booking.id,
          holdId: dto.holdId,
          alreadyApplied: true,
        });
        await this.autoCreateRecurringPlanAfterDeposit(booking.id);
        return replayResult;
      }
      const code = "PUBLIC_BOOKING_HOLD_NOT_FOUND";
      this.logLifecycle({
        event: "confirm_failed",
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        failureCode: code,
        failureStage: "load_hold",
      });
      await this.recordLifecycleAnomaly({
        bookingId: dto.bookingId,
        kind: "public_booking_confirm_failed",
        message: "Public booking confirmation failed.",
        details: {
          bookingId: dto.bookingId,
          holdId: dto.holdId,
          code,
          stage: "load_hold",
          at: new Date().toISOString(),
        },
      });
      throw new NotFoundException({
        code,
        message: "The selected slot hold could not be found.",
      });
    }

    const now = new Date();
    if (hold.expiresAt.getTime() <= now.getTime()) {
      const code = "PUBLIC_BOOKING_HOLD_EXPIRED";
      this.logLifecycle({
        event: "confirm_failed",
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        failureCode: code,
        failureStage: "validate_hold",
      });
      await this.recordLifecycleAnomaly({
        bookingId: dto.bookingId,
        kind: "public_booking_confirm_failed",
        message: "Public booking confirmation failed.",
        details: {
          bookingId: dto.bookingId,
          holdId: dto.holdId,
          code,
          stage: "validate_hold",
          at: new Date().toISOString(),
        },
      });
      throw new ConflictException({
        code,
        message: "The selected slot hold expired before confirmation.",
      });
    }
    if (hold.startAt.getTime() <= now.getTime()) {
      this.logLifecycle({
        event: "confirm_failed",
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        failureCode: "PUBLIC_BOOKING_SLOT_IN_PAST",
        failureStage: "validate_hold",
      });
      await this.recordLifecycleAnomaly({
        bookingId: dto.bookingId,
        kind: "public_booking_confirm_failed",
        message: "Public booking confirmation failed.",
        details: {
          bookingId: dto.bookingId,
          holdId: dto.holdId,
          code: "PUBLIC_BOOKING_SLOT_IN_PAST",
          stage: "validate_hold",
          at: new Date().toISOString(),
        },
      });
      this.throwPastPublicSlot();
    }

    try {
      await this.publicBookingDeposit.ensurePublicDepositResolvedBeforeConfirm({
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        stripePaymentMethodId: dto.stripePaymentMethodId ?? null,
        idempotencyKey: idempotencyKey?.trim() || null,
      });
    } catch (err) {
      const code = this.codeFromError(err, "PUBLIC_BOOKING_DEPOSIT_UNRESOLVED");
      this.logLifecycle({
        event: "confirm_failed",
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        failureCode: code,
        failureStage: "deposit_gate",
        depositRequired: code === "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
      });
      await this.recordLifecycleAnomaly({
        bookingId: dto.bookingId,
        kind: "public_booking_confirm_failed",
        message: "Public booking confirmation failed.",
        details: {
          bookingId: dto.bookingId,
          holdId: dto.holdId,
          code,
          stage: "deposit_gate",
          at: new Date().toISOString(),
        },
      });
      throw err;
    }

    let result;
    let responseHold: { startAt: Date; endAt: Date } = hold;
    try {
      result = await this.bookings.confirmBookingFromHold({
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        note: dto.note,
        idempotencyKey: idempotencyKey?.trim() || null,
        useHoldElapsedDurationModel: true,
      });
    } catch (err) {
      const reason = this.classifyFinalizationFailure(err);
      const code = this.codeFromError(err, "PUBLIC_BOOKING_CONFIRM_FAILED");
      this.logLifecycle({
        event: "confirm_failed",
        bookingId: dto.bookingId,
        holdId: dto.holdId,
        failureCode: code,
        failureStage: "finalize_booking",
      });
      if (!reason && PUBLIC_BOOKING_CONFIRM_ANOMALY_CODES.has(code)) {
        await this.recordLifecycleAnomaly({
          bookingId: dto.bookingId,
          kind: "public_booking_confirm_failed",
          severity: "warning",
          message: "Public booking confirmation failed.",
          details: {
            bookingId: dto.bookingId,
            holdId: dto.holdId,
            code,
            stage: "finalize_booking",
            at: new Date().toISOString(),
          },
        });
      }
      if (reason) {
        const recovered = await this.attemptPostPaymentRecovery({
          booking,
          originalHold: {
            id: hold.id,
            bookingId: hold.bookingId,
            foId: hold.foId,
            startAt: hold.startAt,
            endAt: hold.endAt,
          },
          note: dto.note,
          idempotencyKey: idempotencyKey?.trim() || null,
        });
        if (recovered) {
          result = recovered.result;
          responseHold = recovered.hold;
        } else {
          await this.recordLifecycleAnomaly({
            bookingId: dto.bookingId,
            kind: "public_booking_confirm_failed",
            severity: "critical",
            message: "Public booking confirmation failed.",
            details: {
              bookingId: dto.bookingId,
              holdId: dto.holdId,
              code,
              stage: "finalize_booking",
              at: new Date().toISOString(),
            },
          });
          await this.recordPostPaymentRecoveryFailure({
            bookingId: dto.bookingId,
            holdId: dto.holdId,
            reason,
            err,
          });
          throw err;
        }
      } else {
        await this.recordPostPaymentRecoveryFailure({
          bookingId: dto.bookingId,
          holdId: dto.holdId,
          reason: "NO_RECOVERY_AVAILABLE",
          err,
        });
        throw err;
      }
    }

    const scheduledStart = result.scheduledStart
      ? new Date(result.scheduledStart).toISOString()
      : null;
    const scheduledEnd =
      resolveCanonicalBookingScheduledEnd({
        scheduledStart: result.scheduledStart
          ? new Date(result.scheduledStart)
          : null,
        scheduledEnd:
          "scheduledEnd" in result && result.scheduledEnd != null
            ? new Date(result.scheduledEnd as Date | string)
            : null,
        estimatedHours: result.estimatedHours,
        estimateSnapshotOutputJson: booking.estimateSnapshot?.outputJson,
        preferWallClockFromSnapshot: true,
        hold: {
          startAt: responseHold.startAt,
          endAt: responseHold.endAt,
        },
      })?.toISOString() ?? null;

    this.logLifecycle({
      event: "confirm_succeeded",
      bookingId: result.id,
      holdId: dto.holdId,
      alreadyApplied: Boolean(
        (result as { alreadyApplied?: boolean }).alreadyApplied,
      ),
    });

    await this.autoCreateRecurringPlanAfterDeposit(result.id);

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
