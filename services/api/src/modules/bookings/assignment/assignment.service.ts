import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { FoService } from "../../fo/fo.service";
import { BookingsService } from "../bookings.service";
import type {
  AssignmentCandidate,
  AssignmentReason,
  AssignmentRecommendation,
  AssignmentWorkloadSnapshot,
} from "./assignment.types";
import {
  isAssignedState,
  isInvalidAssignmentState,
} from "../utils/assignment-state.util";

const ACTIVE_ASSIGNED: BookingStatus[] = [BookingStatus.assigned];

const IN_PROGRESS_PIPELINE: BookingStatus[] = [
  BookingStatus.en_route,
  BookingStatus.in_progress,
  BookingStatus.active,
];

/** Same-day “booked load” — `confirmed` mapped to `accepted` (schema has no `confirmed`). */
const SAME_DAY_STATUSES: BookingStatus[] = [
  BookingStatus.accepted,
  BookingStatus.assigned,
  BookingStatus.en_route,
  BookingStatus.in_progress,
  BookingStatus.active,
];

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function dayBoundsUtc(ref: Date): { start: Date; end: Date } {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  const d = ref.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

@Injectable()
export class AssignmentService {
  constructor(
    private readonly db: PrismaService,
    private readonly fo: FoService,
    private readonly bookings: BookingsService,
  ) {}

  private async assertBookingAssignableForRecommendation(bookingId: string) {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        foId: true,
        dispatchLockedAt: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    if (booking.dispatchLockedAt) {
      throw new BadRequestException({
        code: "BOOKING_DISPATCH_LOCKED",
        message: "Booking is currently dispatch-locked.",
      });
    }

    if (isInvalidAssignmentState(booking)) {
      throw new BadRequestException({
        code: "BOOKING_INVALID_STATE",
      });
    }

    if (isAssignedState(booking)) {
      throw new BadRequestException({
        code: "BOOKING_ALREADY_ASSIGNED",
      });
    }

    if (
      booking.status === BookingStatus.in_progress ||
      booking.status === BookingStatus.completed ||
      booking.status === BookingStatus.canceled
    ) {
      throw new BadRequestException({
        code: "BOOKING_NOT_ASSIGNABLE",
        message: `Booking cannot be assigned from status ${booking.status}.`,
      });
    }

    return booking;
  }

  async getRecommendations(bookingId: string): Promise<AssignmentRecommendation[]> {
    return this.buildRecommendations(bookingId);
  }

  async assignRecommended(params: {
    bookingId: string;
    actorUserId: string;
    actorRole: string;
    idempotencyKey?: string | null;
  }) {
    await this.assertBookingAssignableForRecommendation(params.bookingId);
    const items = await this.buildRecommendations(params.bookingId);
    if (items.length === 0) {
      throw new BadRequestException({
        code: "NO_ASSIGNMENT_CANDIDATES",
        message: "No eligible franchise owners available for assignment.",
      });
    }
    const top = items[0];
    await this.assertBookingAssignableForRecommendation(params.bookingId);
    const summary: Record<string, unknown> = {
      engineVersion: "v1",
      rank: top.rank,
      finalRecommendationScore: top.candidate.finalRecommendationScore,
      selectedFoId: top.candidate.foId,
      selectedFoUserId: top.candidate.foUserId,
      reasonCodes: top.candidate.reasons.map((r) => r.code),
    };
    return this.bookings.assignBooking({
      bookingId: params.bookingId,
      foId: top.candidate.foId,
      note: undefined,
      idempotencyKey: params.idempotencyKey ?? null,
      assignmentSource: "recommended",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      recommendationSummary: summary,
    });
  }

  private async buildRecommendations(
    bookingId: string,
  ): Promise<AssignmentRecommendation[]> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        foId: true,
        scheduledStart: true,
        siteLat: true,
        siteLng: true,
      },
    });
    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const fos = await this.db.franchiseOwner.findMany({
      where: {
        status: "active",
        safetyHold: false,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: { id: "asc" },
    });

    const eligible = [] as typeof fos;
    for (const fo of fos) {
      const e = await this.fo.getEligibility(fo.id);
      if (e.canAcceptBooking) {
        eligible.push(fo);
      }
    }

    if (eligible.length === 0) {
      return [];
    }

    const foIds = eligible.map((f) => f.id);
    const related = await this.db.booking.findMany({
      where: {
        foId: { in: foIds },
        id: { not: bookingId },
      },
      select: {
        foId: true,
        status: true,
        scheduledStart: true,
      },
    });

    const refDay = booking.scheduledStart
      ? new Date(booking.scheduledStart)
      : new Date();
    const { start: dayStart, end: dayEnd } = dayBoundsUtc(refDay);

    const byFo = new Map<
      string,
      Array<{ status: BookingStatus; scheduledStart: Date | null }>
    >();
    for (const foId of foIds) {
      byFo.set(foId, []);
    }
    for (const row of related) {
      if (!row.foId) continue;
      const list = byFo.get(row.foId);
      if (!list) continue;
      list.push({
        status: row.status,
        scheduledStart: row.scheduledStart,
      });
    }

    const siteLat =
      booking.siteLat != null && Number.isFinite(booking.siteLat)
        ? booking.siteLat
        : null;
    const siteLng =
      booking.siteLng != null && Number.isFinite(booking.siteLng)
        ? booking.siteLng
        : null;
    const hasSite = siteLat != null && siteLng != null;

    const candidates: AssignmentCandidate[] = [];

    for (const fo of eligible) {
      const rows = byFo.get(fo.id) ?? [];
      let activeAssignedCount = 0;
      let inProgressPipelineCount = 0;
      let todayScheduledCount = 0;

      for (const r of rows) {
        if (ACTIVE_ASSIGNED.includes(r.status)) {
          activeAssignedCount += 1;
        }
        if (IN_PROGRESS_PIPELINE.includes(r.status)) {
          inProgressPipelineCount += 1;
        }
        if (
          SAME_DAY_STATUSES.includes(r.status) &&
          r.scheduledStart != null
        ) {
          const t = new Date(r.scheduledStart);
          if (t >= dayStart && t < dayEnd) {
            todayScheduledCount += 1;
          }
        }
      }

      const workload: AssignmentWorkloadSnapshot = {
        activeAssignedCount,
        inProgressPipelineCount,
        todayScheduledCount,
      };

      const capacityScore = Math.max(
        0,
        Math.min(
          100,
          100 -
            5 * activeAssignedCount -
            8 * inProgressPipelineCount -
            2 * todayScheduledCount,
        ),
      );

      const regionMatchScore = 0.5;
      let serviceAreaFitScore = 0.5;
      let geographyPlaceholderScore = 0.5;
      const reasons: AssignmentReason[] = [];

      if (
        hasSite &&
        fo.homeLat != null &&
        fo.homeLng != null &&
        Number.isFinite(fo.homeLat) &&
        Number.isFinite(fo.homeLng)
      ) {
        const distKm = haversineKm(
          siteLat as number,
          siteLng as number,
          fo.homeLat,
          fo.homeLng,
        );
        const band = Math.min(1, distKm / 120);
        serviceAreaFitScore = Math.max(0, Math.min(1, 1 - band));
        geographyPlaceholderScore = serviceAreaFitScore;
        reasons.push({
          code: "coverage_fit_from_coordinates",
          message:
            "Coverage fit from site vs FO home coordinates (not travel time or road distance).",
        });
      } else {
        reasons.push({
          code: "placeholder_service_area_fit",
          message:
            "Service area fit uses a neutral placeholder until routing data is available.",
        });
        reasons.push({
          code: "placeholder_geography_score",
          message:
            "Geography score is a stable placeholder (no implied mileage or ETA).",
        });
      }

      reasons.push({
        code: "placeholder_region_match",
        message:
          "Region match is a placeholder until a region directory is wired.",
      });

      if (activeAssignedCount > 0) {
        reasons.push({
          code: "workload_active_assigned",
          message: `Penalized for ${activeAssignedCount} active assigned job(s).`,
        });
      }
      if (inProgressPipelineCount > 0) {
        reasons.push({
          code: "workload_in_progress",
          message: `Penalized for ${inProgressPipelineCount} in-flight job(s) (en_route / in_progress / active).`,
        });
      }
      if (todayScheduledCount > 0) {
        reasons.push({
          code: "same_day_scheduled_load",
          message: `Penalized for ${todayScheduledCount} same-day scheduled job(s).`,
        });
      }

      const currentOwner =
        booking.foId != null && String(booking.foId) === String(fo.id);
      if (currentOwner) {
        reasons.push({
          code: "current_owner_preference",
          message: "Favored as current assignee when reloading this booking.",
        });
      }

      reasons.push({
        code: "capacity_balance",
        message: `Capacity score ${capacityScore} reflects load vs headroom.`,
      });

      let finalRecommendationScore =
        100000 -
        2500 * activeAssignedCount -
        4000 * inProgressPipelineCount -
        800 * todayScheduledCount +
        (currentOwner ? 20000 : 0) +
        Math.round(capacityScore * 10) +
        Math.round(serviceAreaFitScore * 500) +
        Math.round(regionMatchScore * 50);

      const displayName =
        (fo.displayName && String(fo.displayName).trim()) ||
        fo.user?.email ||
        fo.id;

      candidates.push({
        foUserId: fo.userId,
        foId: fo.id,
        displayName,
        workload,
        capacityScore,
        regionMatchScore,
        serviceAreaFitScore,
        geographyPlaceholderScore,
        finalRecommendationScore,
        reasons,
      });
    }

    candidates.sort((a, b) => {
      if (b.finalRecommendationScore !== a.finalRecommendationScore) {
        return b.finalRecommendationScore - a.finalRecommendationScore;
      }
      return String(a.foId).localeCompare(String(b.foId));
    });

    return candidates.map((candidate, i) => ({
      rank: i + 1,
      recommended: i === 0,
      candidate,
    }));
  }
}
