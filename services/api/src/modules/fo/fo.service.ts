import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role, type FoStatus as PrismaFoStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma";
import {
  backfillFranchiseOwnerProviders,
  ensureProviderForFranchiseOwner,
} from "./fo-provider-sync";
import {
  deriveFoSupplyQueueState,
  mergeFoSupplyReasonCodes,
  type FoSupplyQueueState,
} from "./fo-supply-queue";
import { evaluateFoExecutionReadiness } from "./fo-execution-readiness";
import type { ServiceSegment } from "../crew-capacity/crew-capacity-policy";
import {
  shouldServiceTypeActAsHardWhitelist,
  type BookingMatchMode,
} from "./service-matching-policy";

export type { BookingMatchMode } from "./service-matching-policy";
import { clampCrewSizeForService } from "../crew-capacity/crew-capacity-policy";
import { resolveFranchiseOwnerCrewRange } from "../crew-capacity/franchise-owner-crew-range";
import {
  computeAssignedCrewSize,
  computeElapsedDurationMinutesFromLabor,
  computeMatchOpsRankScore,
} from "../crew-capacity/assigned-crew-and-duration";
import { getWorkloadMinCrew } from "../crew-capacity/workload-min-crew";
import { evaluateFoSupplyReadiness } from "./fo-supply-readiness";

export enum FoStatus {
  onboarding = "onboarding",
  active = "active",
  paused = "paused",
  suspended = "suspended",
  safety_hold = "safety_hold",
  offboarded = "offboarded",
}

export type FoEligibility = {
  canAcceptBooking: boolean;
  reasons: string[];
};

/** Internal ops / admin supply visibility only — not a customer contract. */
export type FoSupplyOpsCategory =
  | "ready"
  | "blocked_configuration"
  | "inactive_or_restricted";

export type FoExecutionReadinessSnapshot = {
  ok: boolean;
  reasons: string[];
};

export type FoSupplyReadinessDiagnosticItem = {
  franchiseOwnerId: string;
  displayName: string;
  email: string;
  status: string;
  safetyHold: boolean;
  opsCategory: FoSupplyOpsCategory;
  supply: { ok: boolean; reasons: string[] };
  eligibility: FoEligibility;
  /** Provider linkage + identity checks used by dispatch / execution paths. */
  execution: FoExecutionReadinessSnapshot;
  configSummary: {
    hasCoordinates: boolean;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    scheduleRowCount: number;
    matchableServiceTypes: string[];
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
    crewCapacity?: {
      teamSize: number | null;
      minCrewSize: number | null;
      preferredCrewSize: number | null;
      maxCrewSize: number | null;
      resolvedMin: number;
      resolvedPreferred: number;
      resolvedMax: number;
    };
  };
};

export type { FoSupplyQueueState } from "./fo-supply-queue";

export type AdminFoSupplyOverviewItem = {
  id: string;
  displayName: string;
  email: string;
  status: string;
  safetyHold: boolean;
  supplyOk: boolean;
  executionOk: boolean;
  bookingEligible: boolean;
  mergedReasonCodes: string[];
  queueState: FoSupplyQueueState;
  configSummary: {
    hasCoordinates: boolean;
    scheduleRowCount: number;
    maxTravelMinutes: number | null;
    matchableServiceTypes: string[];
    maxDailyLaborMinutes: number | null;
  };
};

/** Internal admin supply FO detail — extends overview types with server readiness truth. */
export type AdminFoSupplyScheduleSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type AdminFoSupplyDetailResponse = {
  foId: string;
  foName: string;
  territory: string | null;
  riskLevel: "low" | "medium" | "high" | "critical";
  daysUntilStockout: number | null;
  totalOpenDemand: number;
  lastRestockAt: string | null;
  skuNeeds: Array<{
    skuId: string;
    skuName: string;
    quantityNeeded: number;
    priority: number;
  }>;
  shipmentHistory: Array<{
    id: string;
    shippedAt: string;
    value: number;
    status: string;
  }>;
  readiness: FoSupplyReadinessDiagnosticItem;
  /** Same derivation as fleet overview — server-only. */
  queueState: FoSupplyQueueState;
  mergedReasonCodes: string[];
  schedules: AdminFoSupplyScheduleSlot[];
};

export type JobMatchInput = {
  lat: number;
  lng: number;
  squareFootage: number;
  estimatedLaborMinutes: number;
  recommendedTeamSize: number;
  /** Requested estimator service type (drives crew policy + optional allow-list). */
  serviceType?: string;
  /** Defaults to residential when omitted (backward compatible). */
  serviceSegment?: ServiceSegment;
  limit?: number;
  /**
   * Optional booking context for `matchableServiceTypes` policy (see `service-matching-policy`).
   * Omitted = legacy strict allow-list behavior where applicable.
   */
  bookingMatchMode?: BookingMatchMode;
};

@Injectable()
export class FoService {
  constructor(private readonly db: PrismaService) {}

  async getFo(id: string) {
    const fo = await this.db.franchiseOwner.findUnique({ where: { id } });
    if (!fo) throw new NotFoundException("FO_NOT_FOUND");
    return fo;
  }

  async ensureProviderLinked(foId: string) {
    await ensureProviderForFranchiseOwner(this.db, foId);

    const fo = await this.db.franchiseOwner.findUnique({
      where: { id: foId },
      include: { provider: true },
    });

    if (!fo) throw new NotFoundException("FO_NOT_FOUND");
    return fo;
  }

  async backfillMissingProviders(batchSize = 100) {
    return backfillFranchiseOwnerProviders(this.db, batchSize);
  }

  /**
   * Booking eligibility for one FO — status / safety / ban / deleted first,
   * then `evaluateFoSupplyReadiness` (same primitive checks as `matchFOs`).
   */
  eligibilityFromFranchiseOwnerRow(fo: {
    status: string;
    safetyHold: boolean | null;
    isDeleted?: boolean | null;
    isBanned?: boolean | null;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
    _count: { foSchedules: number };
  }): FoEligibility {
    const reasons: string[] = [];

    const status = String(fo.status ?? "").toLowerCase();
    if (status !== FoStatus.active) reasons.push("FO_NOT_ACTIVE");

    const safetyHold = Boolean(fo.safetyHold ?? false);
    if (safetyHold || status === FoStatus.safety_hold) {
      reasons.push("FO_SAFETY_HOLD");
    }

    if (fo.isDeleted === true) reasons.push("FO_DELETED");
    if (fo.isBanned === true) reasons.push("FO_BANNED");

    if (reasons.length === 0) {
      const supply = evaluateFoSupplyReadiness({
        homeLat: fo.homeLat,
        homeLng: fo.homeLng,
        maxTravelMinutes: fo.maxTravelMinutes,
        maxDailyLaborMinutes: fo.maxDailyLaborMinutes,
        maxLaborMinutes: fo.maxLaborMinutes,
        maxSquareFootage: fo.maxSquareFootage,
        scheduleRowCount: fo._count?.foSchedules ?? 0,
      });
      reasons.push(...supply.reasons);
    }

    return {
      canAcceptBooking: reasons.length === 0,
      reasons,
    };
  }

  async getEligibility(foId: string): Promise<FoEligibility> {
    const fo = await this.db.franchiseOwner.findUnique({
      where: { id: foId },
      include: { _count: { select: { foSchedules: true } } },
    });
    if (!fo) throw new NotFoundException("FO_NOT_FOUND");
    return this.eligibilityFromFranchiseOwnerRow({
      ...fo,
      _count: { foSchedules: fo._count.foSchedules },
    });
  }

  private mapFranchiseOwnerRowToSupplyDiagnostic(fo: {
    id: string;
    userId: string;
    providerId: string | null;
    displayName: string | null;
    status: string;
    safetyHold: boolean | null;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
    matchableServiceTypes: string[];
    teamSize: number | null;
    minCrewSize: number | null;
    preferredCrewSize: number | null;
    maxCrewSize: number | null;
    user: { email: string };
    provider?: { userId: string } | null;
    _count: { foSchedules: number };
  }): FoSupplyReadinessDiagnosticItem {
    const foRow = fo as typeof fo & {
      isDeleted?: boolean | null;
      isBanned?: boolean | null;
    };
    const scheduleRowCount = fo._count.foSchedules;
    const supply = evaluateFoSupplyReadiness({
      homeLat: fo.homeLat,
      homeLng: fo.homeLng,
      maxTravelMinutes: fo.maxTravelMinutes,
      maxDailyLaborMinutes: fo.maxDailyLaborMinutes,
      maxLaborMinutes: fo.maxLaborMinutes,
      maxSquareFootage: fo.maxSquareFootage,
      scheduleRowCount,
    });

    const eligibility = this.eligibilityFromFranchiseOwnerRow({
      status: fo.status,
      safetyHold: fo.safetyHold,
      isDeleted: foRow.isDeleted,
      isBanned: foRow.isBanned,
      homeLat: fo.homeLat,
      homeLng: fo.homeLng,
      maxTravelMinutes: fo.maxTravelMinutes,
      maxDailyLaborMinutes: fo.maxDailyLaborMinutes,
      maxLaborMinutes: fo.maxLaborMinutes,
      maxSquareFootage: fo.maxSquareFootage,
      _count: { foSchedules: scheduleRowCount },
    });

    const execution = evaluateFoExecutionReadiness({
      franchiseOwnerUserId: fo.userId,
      providerId: fo.providerId,
      providerUserId: fo.provider?.userId,
    });

    const statusLc = String(fo.status ?? "").toLowerCase();
    const inactiveOrRestricted =
      statusLc !== FoStatus.active ||
      foRow.isDeleted === true ||
      foRow.isBanned === true ||
      Boolean(fo.safetyHold);

    let opsCategory: FoSupplyOpsCategory;
    if (inactiveOrRestricted) {
      opsCategory = "inactive_or_restricted";
    } else if (supply.ok && eligibility.canAcceptBooking && execution.ok) {
      opsCategory = "ready";
    } else {
      opsCategory = "blocked_configuration";
    }

    const hasCoordinates =
      fo.homeLat != null &&
      fo.homeLng != null &&
      Number.isFinite(fo.homeLat) &&
      Number.isFinite(fo.homeLng);

    const resolvedCrew = resolveFranchiseOwnerCrewRange({
      teamSize: fo.teamSize,
      minCrewSize: fo.minCrewSize,
      preferredCrewSize: fo.preferredCrewSize,
      maxCrewSize: fo.maxCrewSize,
    });

    return {
      franchiseOwnerId: fo.id,
      displayName: (fo.displayName?.trim() || fo.user.email) ?? fo.id,
      email: fo.user.email,
      status: fo.status,
      safetyHold: Boolean(fo.safetyHold),
      opsCategory,
      supply: { ok: supply.ok, reasons: supply.reasons },
      eligibility,
      execution: { ok: execution.ok, reasons: execution.reasons },
      configSummary: {
        hasCoordinates,
        homeLat: fo.homeLat,
        homeLng: fo.homeLng,
        maxTravelMinutes: fo.maxTravelMinutes,
        scheduleRowCount,
        matchableServiceTypes: [...(fo.matchableServiceTypes ?? [])],
        maxDailyLaborMinutes: fo.maxDailyLaborMinutes,
        maxLaborMinutes: fo.maxLaborMinutes,
        maxSquareFootage: fo.maxSquareFootage,
        crewCapacity: {
          teamSize: fo.teamSize,
          minCrewSize: fo.minCrewSize,
          preferredCrewSize: fo.preferredCrewSize,
          maxCrewSize: fo.maxCrewSize,
          resolvedMin: resolvedCrew.minCrewSize,
          resolvedPreferred: resolvedCrew.preferredCrewSize,
          resolvedMax: resolvedCrew.maxCrewSize,
        },
      },
    };
  }

  /**
   * Admin / system ops: full FO list with centralized supply + eligibility truth.
   */
  async listFoSupplyReadinessDiagnostics(): Promise<
    FoSupplyReadinessDiagnosticItem[]
  > {
    const rows = await this.db.franchiseOwner.findMany({
      include: {
        user: { select: { email: true } },
        provider: { select: { userId: true } },
        _count: { select: { foSchedules: true } },
      },
      orderBy: [{ displayName: "asc" }, { id: "asc" }],
    });

    return rows.map((fo) => this.mapFranchiseOwnerRowToSupplyDiagnostic(fo as never));
  }

  /**
   * Fleet-level FO supply overview — rows are `listFoSupplyReadinessDiagnostics()`
   * plus derived queue state and merged reason codes (no duplicated readiness math).
   */
  async listAdminSupplyFranchiseOwnersOverview(options?: {
    queue?: FoSupplyQueueState | null;
  }): Promise<{ items: AdminFoSupplyOverviewItem[] }> {
    const diagnostics = await this.listFoSupplyReadinessDiagnostics();
    let items: AdminFoSupplyOverviewItem[] = diagnostics.map((row) => ({
      id: row.franchiseOwnerId,
      displayName: row.displayName,
      email: row.email,
      status: row.status,
      safetyHold: row.safetyHold,
      supplyOk: row.supply.ok,
      executionOk: row.execution.ok,
      bookingEligible: row.eligibility.canAcceptBooking,
      mergedReasonCodes: mergeFoSupplyReasonCodes({
        opsCategory: row.opsCategory,
        supply: row.supply,
        eligibility: row.eligibility,
        execution: row.execution,
      }),
      queueState: deriveFoSupplyQueueState({
        opsCategory: row.opsCategory,
        supply: row.supply,
        eligibility: row.eligibility,
        execution: row.execution,
      }),
      configSummary: {
        hasCoordinates: row.configSummary.hasCoordinates,
        scheduleRowCount: row.configSummary.scheduleRowCount,
        maxTravelMinutes: row.configSummary.maxTravelMinutes,
        matchableServiceTypes: row.configSummary.matchableServiceTypes,
        maxDailyLaborMinutes: row.configSummary.maxDailyLaborMinutes,
      },
    }));

    const q = options?.queue;
    if (q) {
      items = items.filter((i) => i.queueState === q);
    }

    return { items };
  }

  async getAdminFoSupplyDetail(foId: string): Promise<AdminFoSupplyDetailResponse> {
    const fo = await this.db.franchiseOwner.findFirst({
      where: { id: foId },
      include: {
        user: { select: { email: true } },
        provider: { select: { userId: true } },
        _count: { select: { foSchedules: true } },
      },
    });
    if (!fo) throw new NotFoundException("FO_NOT_FOUND");

    const schedules = await this.db.foSchedule.findMany({
      where: { franchiseOwnerId: foId },
      orderBy: [{ dayOfWeek: "asc" }],
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });

    const readiness = this.mapFranchiseOwnerRowToSupplyDiagnostic(fo as never);

    return {
      foId: fo.id,
      foName: readiness.displayName,
      territory: null,
      riskLevel: "low",
      daysUntilStockout: null,
      totalOpenDemand: 0,
      lastRestockAt: null,
      skuNeeds: [],
      shipmentHistory: [],
      readiness,
      queueState: deriveFoSupplyQueueState({
        opsCategory: readiness.opsCategory,
        supply: readiness.supply,
        eligibility: readiness.eligibility,
        execution: readiness.execution,
      }),
      mergedReasonCodes: mergeFoSupplyReasonCodes({
        opsCategory: readiness.opsCategory,
        supply: readiness.supply,
        eligibility: readiness.eligibility,
        execution: readiness.execution,
      }),
      schedules,
    };
  }

  /**
   * Admin-only draft FO: linked FO user + `onboarding` franchise owner row.
   * Does not activate or require schedule (Prisma guard allows non-active creates).
   */
  async createAdminDraftFranchiseOwner(body: {
    displayName?: unknown;
    email?: unknown;
  }): Promise<AdminFoSupplyDetailResponse> {
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const emailRaw =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!displayName) {
      throw new BadRequestException("DISPLAY_NAME_REQUIRED");
    }
    if (!emailRaw) {
      throw new BadRequestException("EMAIL_REQUIRED");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      throw new BadRequestException("EMAIL_INVALID");
    }

    const exists = await this.db.user.findUnique({ where: { email: emailRaw } });
    if (exists) {
      throw new ConflictException("USER_EMAIL_IN_USE");
    }

    const passwordHash = await bcrypt.hash(
      `fo-admin-draft:${randomBytes(24).toString("hex")}`,
      10,
    );

    const user = await this.db.user.create({
      data: {
        email: emailRaw,
        passwordHash,
        role: Role.fo,
      },
    });

    const fo = await this.db.franchiseOwner.create({
      data: {
        userId: user.id,
        status: FoStatus.onboarding,
        displayName,
        safetyHold: false,
      },
    });

    await this.ensureProviderLinked(fo.id);
    return this.getAdminFoSupplyDetail(fo.id);
  }

  async patchFranchiseOwnerAdmin(
    foId: string,
    body: Record<string, unknown>,
  ): Promise<AdminFoSupplyDetailResponse> {
    await this.getFo(foId);

    const data: Record<string, unknown> = {};

    if ("displayName" in body) {
      const v = body.displayName;
      data.displayName =
        v === null || v === undefined
          ? null
          : typeof v === "string"
            ? v
            : String(v);
    }
    if ("homeLat" in body) {
      data.homeLat =
        body.homeLat === null || body.homeLat === ""
          ? null
          : Number(body.homeLat);
    }
    if ("homeLng" in body) {
      data.homeLng =
        body.homeLng === null || body.homeLng === ""
          ? null
          : Number(body.homeLng);
    }
    if ("maxTravelMinutes" in body) {
      data.maxTravelMinutes =
        body.maxTravelMinutes === null || body.maxTravelMinutes === ""
          ? null
          : Number(body.maxTravelMinutes);
    }
    if ("maxDailyLaborMinutes" in body) {
      data.maxDailyLaborMinutes =
        body.maxDailyLaborMinutes === null || body.maxDailyLaborMinutes === ""
          ? null
          : Number(body.maxDailyLaborMinutes);
    }
    if ("maxLaborMinutes" in body) {
      data.maxLaborMinutes =
        body.maxLaborMinutes === null || body.maxLaborMinutes === ""
          ? null
          : Number(body.maxLaborMinutes);
    }
    if ("maxSquareFootage" in body) {
      data.maxSquareFootage =
        body.maxSquareFootage === null || body.maxSquareFootage === ""
          ? null
          : Number(body.maxSquareFootage);
    }
    if ("matchableServiceTypes" in body && Array.isArray(body.matchableServiceTypes)) {
      data.matchableServiceTypes = body.matchableServiceTypes.map((x) =>
        String(x),
      );
    }
    if ("status" in body && body.status !== undefined && body.status !== null) {
      data.status = String(body.status) as PrismaFoStatus;
    }
    if ("safetyHold" in body && typeof body.safetyHold === "boolean") {
      data.safetyHold = body.safetyHold;
    }
    if ("teamSize" in body) {
      data.teamSize =
        body.teamSize === null || body.teamSize === ""
          ? null
          : Number(body.teamSize);
    }
    if ("minCrewSize" in body) {
      data.minCrewSize =
        body.minCrewSize === null || body.minCrewSize === ""
          ? null
          : Number(body.minCrewSize);
    }
    if ("preferredCrewSize" in body) {
      data.preferredCrewSize =
        body.preferredCrewSize === null || body.preferredCrewSize === ""
          ? null
          : Number(body.preferredCrewSize);
    }
    if ("maxCrewSize" in body) {
      data.maxCrewSize =
        body.maxCrewSize === null || body.maxCrewSize === ""
          ? null
          : Number(body.maxCrewSize);
    }

    if (Object.keys(data).length > 0) {
      await this.db.franchiseOwner.update({
        where: { id: foId },
        data: data as never,
      });
    }

    return this.getAdminFoSupplyDetail(foId);
  }

  async canAcceptBooking(foId: string) {
    const eligibility = await this.getEligibility(foId);
    return eligibility.canAcceptBooking;
  }

  async getEligibleFOs() {
    return this.db.franchiseOwner.findMany({
      where: {
        status: "active",
        safetyHold: false,
      },
      include: {
        _count: {
          select: { foSchedules: true },
        },
        provider: { select: { userId: true } },
      },
    });
  }

  private distanceKm(
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

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private travelMinutes(distanceKm: number) {
    const avgSpeedKmh = 40;
    return (distanceKm / avgSpeedKmh) * 60;
  }

  async matchFOs(input: JobMatchInput) {
    const fos = await this.getEligibleFOs();

    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const scored: any[] = [];

    for (const fo of fos) {
      const supply = evaluateFoSupplyReadiness({
        homeLat: fo.homeLat,
        homeLng: fo.homeLng,
        maxTravelMinutes: fo.maxTravelMinutes,
        maxDailyLaborMinutes: fo.maxDailyLaborMinutes,
        maxLaborMinutes: fo.maxLaborMinutes,
        maxSquareFootage: fo.maxSquareFootage,
        scheduleRowCount: (fo as { _count?: { foSchedules?: number } })._count
          ?.foSchedules ?? 0,
      });
      if (!supply.ok) continue;

      const exec = evaluateFoExecutionReadiness({
        franchiseOwnerUserId: fo.userId,
        providerId: fo.providerId,
        providerUserId: fo.provider?.userId,
      });
      if (!exec.ok) continue;

      const homeLat = fo.homeLat as number;
      const homeLng = fo.homeLng as number;

      const dist = this.distanceKm(input.lat, input.lng, homeLat, homeLng);

      const travelMinutes = this.travelMinutes(dist);

      if (fo.maxTravelMinutes && travelMinutes > fo.maxTravelMinutes) continue;

      if (fo.maxSquareFootage && input.squareFootage > fo.maxSquareFootage) {
        continue;
      }

      if (
        fo.maxLaborMinutes &&
        input.estimatedLaborMinutes > fo.maxLaborMinutes
      ) {
        continue;
      }

      const segment: ServiceSegment = input.serviceSegment ?? "residential";
      const serviceType = String(input.serviceType ?? "maintenance");
      const normRec = clampCrewSizeForService(
        serviceType,
        segment,
        input.recommendedTeamSize,
      );
      const crew = resolveFranchiseOwnerCrewRange({
        teamSize: fo.teamSize,
        minCrewSize: fo.minCrewSize ?? null,
        preferredCrewSize: fo.preferredCrewSize ?? null,
        maxCrewSize: fo.maxCrewSize ?? null,
      });
      const workloadMinCrew = getWorkloadMinCrew({
        estimatedLaborMinutes: input.estimatedLaborMinutes,
        squareFootage: input.squareFootage,
        serviceType,
      });
      if (crew.maxCrewSize < workloadMinCrew) {
        continue;
      }

      const allowed = fo.matchableServiceTypes;
      const enforceServiceWhitelist = shouldServiceTypeActAsHardWhitelist(
        input.serviceType,
        segment,
        input.bookingMatchMode,
      );
      if (
        enforceServiceWhitelist &&
        Array.isArray(allowed) &&
        allowed.length > 0 &&
        (!input.serviceType || !allowed.includes(input.serviceType))
      ) {
        continue;
      }

      if (fo.maxDailyLaborMinutes) {
        const todaysBookings = await this.db.booking.findMany({
          where: {
            foId: fo.id,
            scheduledStart: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          select: {
            estimatedHours: true,
          },
        });

        const alreadyCommittedMinutes = todaysBookings.reduce(
          (sum, b) => sum + Math.round((b.estimatedHours ?? 0) * 60),
          0,
        );

        if (
          alreadyCommittedMinutes + input.estimatedLaborMinutes >
          fo.maxDailyLaborMinutes
        ) {
          continue;
        }
      }

      const reliabilityScore = fo.reliabilityScore ?? 0;

      const assignedCrewSize = computeAssignedCrewSize({
        serviceType,
        serviceSegment: segment,
        normalizedRecommendedCrewSize: normRec,
        candidate: crew,
        workloadMinCrew,
      });
      const estimatedJobDurationMinutes = computeElapsedDurationMinutesFromLabor(
        input.estimatedLaborMinutes,
        assignedCrewSize,
      );
      const score = computeMatchOpsRankScore({
        reliabilityScore,
        travelMinutes,
        assignedCrewSize,
        normalizedRecommendedCrewSize: normRec,
        estimatedJobDurationMinutes,
      });

      scored.push({
        fo,
        score,
        travelMinutes,
        assignedCrewSize,
        estimatedJobDurationMinutes,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    const limit =
      typeof input.limit === "number" &&
      Number.isFinite(input.limit) &&
      input.limit > 0
        ? Math.floor(input.limit)
        : 2;

    return scored.slice(0, limit).map((s) => ({
      id: s.fo.id,
      displayName: s.fo.displayName,
      photoUrl: s.fo.photoUrl,
      bio: s.fo.bio,
      yearsExperience: s.fo.yearsExperience,
      completedJobsCount: s.fo.completedJobsCount,
      teamSize: s.fo.teamSize,
      reliabilityScore: s.fo.reliabilityScore,
      travelMinutes: Math.round(s.travelMinutes),
      assignedCrewSize: s.assignedCrewSize,
      estimatedJobDurationMinutes: s.estimatedJobDurationMinutes,
    }));
  }
}
