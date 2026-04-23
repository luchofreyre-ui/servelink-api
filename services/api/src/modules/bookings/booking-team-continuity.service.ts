import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { FoService, type JobMatchInput } from "../fo/fo.service";
import { parseEstimateJobMatchFields } from "../crew-capacity/parse-estimate-job-match-fields";

const PLAN_SERVICES_WITH_CONTINUITY_SCHEDULING = new Set([
  "recurring-home-cleaning",
  "deep-cleaning",
]);

export type ContinuityTeamOption = {
  id: string;
  displayName: string;
  assignedCrewSize?: number;
  estimatedDurationMinutes?: number;
};

export type ScheduleTeamContinuityReason =
  | "continuity"
  | "prior_ineligible"
  | "no_prior_team"
  | "no_site_coordinates"
  | "missing_plan_estimate";

export type RecurringScheduleTeamOptionsResponse = {
  ok: true;
  bookingMatchMode: "authenticated_recurring";
  teams: ContinuityTeamOption[];
  primaryTeam: ContinuityTeamOption | null;
  preferredPriorTeam: ContinuityTeamOption | null;
  alternateTeams: ContinuityTeamOption[];
  teamContinuityReason: ScheduleTeamContinuityReason | null;
};

function snapshotStringsFromPlanJson(
  raw: unknown,
): { inputJson: string; outputJson: string } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.inputJson === "string" && typeof o.outputJson === "string") {
    return { inputJson: o.inputJson, outputJson: o.outputJson };
  }
  return null;
}

function parseLatLngFromAddressSnapshot(
  raw: unknown,
): { lat: number; lng: number } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  const latRaw = a.latitude ?? a.lat ?? a.siteLat;
  const lngRaw = a.longitude ?? a.lng ?? a.siteLng;
  const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parseServiceTypeFromEstimateInputJson(
  inputJson: string | null | undefined,
): string | null {
  if (!inputJson?.trim()) return null;
  try {
    const o = JSON.parse(inputJson) as Record<string, unknown>;
    const st = o.service_type;
    return typeof st === "string" ? st : null;
  } catch {
    return null;
  }
}

function mapMatchToOption(m: {
  id: string;
  displayName: string | null;
  assignedCrewSize?: number;
  estimatedJobDurationMinutes?: number;
}): ContinuityTeamOption {
  return {
    id: m.id,
    displayName: String(m.displayName ?? "").trim() || "Team",
    assignedCrewSize: m.assignedCrewSize,
    estimatedDurationMinutes: m.estimatedJobDurationMinutes,
  };
}

@Injectable()
export class BookingTeamContinuityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fo: FoService,
  ) {}

  /**
   * Most recent completed booking with an assigned FO whose estimate was
   * residential maintenance-like (maintenance / deep_clean — not move flows).
   */
  async findPriorFoIdForContinuityMaintenance(
    customerId: string,
  ): Promise<string | null> {
    const rows = await this.prisma.booking.findMany({
      where: {
        customerId,
        status: BookingStatus.completed,
        foId: { not: null },
      },
      orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
      take: 40,
      select: {
        foId: true,
        estimateSnapshot: { select: { inputJson: true } },
      },
    });
    for (const r of rows) {
      const foId = r.foId?.trim();
      if (!foId) continue;
      const st = parseServiceTypeFromEstimateInputJson(
        r.estimateSnapshot?.inputJson ?? null,
      );
      if (st === "maintenance" || st === "deep_clean") {
        return foId;
      }
    }
    return null;
  }

  async resolveScheduleTeamOptionsForRecurringPlan(
    planId: string,
    customerId: string,
    opts: { includeAlternateTeams: boolean },
  ): Promise<RecurringScheduleTeamOptionsResponse> {
    const plan = await this.prisma.recurringPlan.findFirst({
      where: { id: planId, customerId },
      select: {
        id: true,
        serviceType: true,
        estimateSnapshot: true,
        addressSnapshot: true,
      },
    });
    if (!plan) {
      throw new NotFoundException("Recurring plan not found.");
    }
    if (!PLAN_SERVICES_WITH_CONTINUITY_SCHEDULING.has(plan.serviceType)) {
      throw new BadRequestException(
        "Team scheduling options are only available for recurring / maintenance-eligible plans.",
      );
    }

    const snap = snapshotStringsFromPlanJson(plan.estimateSnapshot);
    if (!snap) {
      return {
        ok: true,
        bookingMatchMode: "authenticated_recurring",
        teams: [],
        primaryTeam: null,
        preferredPriorTeam: null,
        alternateTeams: [],
        teamContinuityReason: "missing_plan_estimate",
      };
    }

    const jobMatch = parseEstimateJobMatchFields(snap);
    if (!jobMatch) {
      return {
        ok: true,
        bookingMatchMode: "authenticated_recurring",
        teams: [],
        primaryTeam: null,
        preferredPriorTeam: null,
        alternateTeams: [],
        teamContinuityReason: "missing_plan_estimate",
      };
    }

    const site = parseLatLngFromAddressSnapshot(plan.addressSnapshot);
    if (!site) {
      return {
        ok: true,
        bookingMatchMode: "authenticated_recurring",
        teams: [],
        primaryTeam: null,
        preferredPriorTeam: null,
        alternateTeams: [],
        teamContinuityReason: "no_site_coordinates",
      };
    }

    const priorFoId = await this.findPriorFoIdForContinuityMaintenance(
      customerId,
    );

    const matchInput: JobMatchInput = {
      lat: site.lat,
      lng: site.lng,
      squareFootage: jobMatch.squareFootage,
      estimatedLaborMinutes: jobMatch.estimatedLaborMinutes,
      recommendedTeamSize: jobMatch.recommendedTeamSize,
      serviceType: jobMatch.serviceType,
      serviceSegment: jobMatch.serviceSegment,
      limit: 24,
      bookingMatchMode: "authenticated_recurring",
    };

    const ranked = await this.fo.matchFOs(matchInput);
    const byId = new Map(ranked.map((m) => [m.id, m] as const));

    let teamContinuityReason: ScheduleTeamContinuityReason | null = null;
    let ordered = ranked.map(mapMatchToOption);

    if (priorFoId) {
      const priorInPool = byId.has(priorFoId);
      if (priorInPool && ordered.length > 0) {
        const ix = ordered.findIndex((t) => t.id === priorFoId);
        if (ix > 0) {
          const [row] = ordered.splice(ix, 1);
          ordered.unshift(row);
        }
        teamContinuityReason = "continuity";
      } else {
        teamContinuityReason = "prior_ineligible";
      }
    } else {
      teamContinuityReason = "no_prior_team";
    }

    const primaryTeam = ordered[0] ?? null;
    const alternateTeams = opts.includeAlternateTeams
      ? ordered.slice(1)
      : [];
    const teams = opts.includeAlternateTeams
      ? ordered
      : primaryTeam
        ? [primaryTeam]
        : [];

    const preferredPriorTeam =
      priorFoId && primaryTeam?.id === priorFoId ? primaryTeam : null;

    return {
      ok: true,
      bookingMatchMode: "authenticated_recurring",
      teams,
      primaryTeam,
      preferredPriorTeam,
      alternateTeams,
      teamContinuityReason,
    };
  }
}
