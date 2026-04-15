import { Injectable } from "@nestjs/common";
import { FoStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { DispatchCandidateService } from "../dispatch/dispatch-candidate.service";
import { RosterAvailabilityService } from "../dispatch/roster-availability.service";
import type { AvailabilityWindowsAggregateQueryDto } from "./dto/availability-windows-aggregate-query.dto";
import { SlotAvailabilityService } from "../slot-holds/slot-availability.service";

export type AvailabilityProviderCandidate = {
  cleanerId: string;
  cleanerLabel: string;
  foId: string;
  providerId?: string | null;
  supportsRecurring?: boolean;
  serviceAreaZip5?: string | null;
  rankingHints?: {
    preferredCleanerMatch?: boolean;
    dispatchEligible?: boolean;
  };
};

export type ProviderBackedAvailabilityWindow = {
  foId: string;
  cleanerId: string | null;
  cleanerLabel: string | null;
  startAt: string;
  endAt: string;
  windowLabel: string;
  source: "preferred_provider" | "candidate_provider";
};

export type AggregatedAvailabilityResponse = {
  mode: "preferred_provider_only" | "multi_provider_candidates";
  windows: ProviderBackedAvailabilityWindow[];
};

@Injectable()
export class BookingAvailabilityAggregateService {
  constructor(
    private readonly slotAvailability: SlotAvailabilityService,
    private readonly roster: RosterAvailabilityService,
    private readonly dispatchCandidates: DispatchCandidateService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Resolves a query `preferredFoId` to a real active franchise owner id, or `null` if unknown/ineligible.
   * Invalid ids are ignored (no 400) so aggregation still returns truthful candidate windows.
   */
  async resolveEligiblePreferredFoId(
    preferredFoId: string | null | undefined,
  ): Promise<string | null> {
    const raw = preferredFoId?.trim() || null;
    if (!raw) return null;
    const row = await this.prisma.franchiseOwner.findFirst({
      where: {
        id: raw,
        status: FoStatus.active,
        safetyHold: false,
        providerId: { not: null },
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  private formatWindowLabel(startAt: Date, endAt: Date): string {
    if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
      return "";
    }
    return `${startAt.toISOString()} → ${endAt.toISOString()}`;
  }

  async resolveAvailabilityProviderCandidates(args: {
    preferredFoId?: string | null;
    siteLat?: number;
    siteLng?: number;
    squareFootage?: number;
    estimatedLaborMinutes?: number;
    recommendedTeamSize?: number;
    maxProviders: number;
  }): Promise<AvailabilityProviderCandidate[]> {
    const preferred = args.preferredFoId?.trim() || null;
    const max = Math.min(40, Math.max(1, args.maxProviders));

    const geoReady =
      args.siteLat != null &&
      args.siteLng != null &&
      Number.isFinite(args.siteLat) &&
      Number.isFinite(args.siteLng) &&
      args.squareFootage != null &&
      args.squareFootage > 0 &&
      args.estimatedLaborMinutes != null &&
      args.estimatedLaborMinutes > 0;

    const rosterRows = await this.roster.getAvailableCleanersForBookingIntent({});

    const fromRosterFo = (foId: string): AvailabilityProviderCandidate | null => {
      const r = rosterRows.find((x) => x.cleanerId === foId);
      if (!r) return null;
      return {
        foId: r.cleanerId,
        cleanerId: r.cleanerId,
        cleanerLabel: r.cleanerLabel,
        providerId: r.providerId ?? null,
        supportsRecurring: r.supportsRecurring,
        serviceAreaZip5: r.serviceAreaZip5 ?? null,
        rankingHints: {
          preferredCleanerMatch: preferred === foId,
          dispatchEligible: false,
        },
      };
    };

    const out: AvailabilityProviderCandidate[] = [];
    const pushUnique = (row: AvailabilityProviderCandidate) => {
      if (out.some((x) => x.foId === row.foId)) return;
      if (out.length >= max) return;
      out.push(row);
    };

    if (geoReady) {
      const raw = await this.dispatchCandidates.getCandidates({
        lat: args.siteLat!,
        lng: args.siteLng!,
        squareFootage: args.squareFootage!,
        estimatedLaborMinutes: args.estimatedLaborMinutes!,
        recommendedTeamSize: args.recommendedTeamSize ?? 1,
      });
      const eligible = raw
        .filter((c) => c.canReceiveDispatch && c.foId)
        .sort((a, b) => {
          if (b.baseRank !== a.baseRank) return b.baseRank - a.baseRank;
          return String(a.foId).localeCompare(String(b.foId));
        });

      if (preferred) {
        const inEligible = eligible.some((c) => c.foId === preferred);
        if (inEligible) {
          const pRow = eligible.find((c) => c.foId === preferred)!;
          pushUnique({
            foId: preferred,
            cleanerId: preferred,
            cleanerLabel: pRow.displayName?.trim() || "Provider",
            providerId: pRow.providerId || null,
            rankingHints: {
              preferredCleanerMatch: true,
              dispatchEligible: true,
            },
          });
        } else {
          const fallback = fromRosterFo(preferred);
          if (fallback) {
            fallback.rankingHints = {
              preferredCleanerMatch: true,
              dispatchEligible: false,
            };
            pushUnique(fallback);
          }
        }
      }

      for (const c of eligible) {
        const id = c.foId!;
        if (preferred && id === preferred && out.some((x) => x.foId === preferred)) continue;
        pushUnique({
          foId: id,
          cleanerId: id,
          cleanerLabel: c.displayName?.trim() || "Provider",
          providerId: c.providerId || null,
          rankingHints: {
            preferredCleanerMatch: preferred === id,
            dispatchEligible: true,
          },
        });
      }
      return out;
    }

    const rows = [...rosterRows].sort((a, b) => a.cleanerId.localeCompare(b.cleanerId));
    if (preferred) {
      const pr = rows.find((r) => r.cleanerId === preferred);
      if (pr) {
        pushUnique({
          foId: preferred,
          cleanerId: pr.cleanerId,
          cleanerLabel: pr.cleanerLabel,
          providerId: pr.providerId ?? null,
          supportsRecurring: pr.supportsRecurring,
          serviceAreaZip5: pr.serviceAreaZip5 ?? null,
          rankingHints: { preferredCleanerMatch: true, dispatchEligible: false },
        });
      }
    }
    for (const r of rows) {
      if (preferred && r.cleanerId === preferred) continue;
      pushUnique({
        foId: r.cleanerId,
        cleanerId: r.cleanerId,
        cleanerLabel: r.cleanerLabel,
        providerId: r.providerId ?? null,
        supportsRecurring: r.supportsRecurring,
        serviceAreaZip5: r.serviceAreaZip5 ?? null,
        rankingHints: {
          preferredCleanerMatch: preferred === r.cleanerId,
          dispatchEligible: false,
        },
      });
    }
    return out;
  }

  computeResponseMode(
    preferredFoId: string | null | undefined,
    candidates: AvailabilityProviderCandidate[],
  ): AggregatedAvailabilityResponse["mode"] {
    const preferred = preferredFoId?.trim() || null;
    const distinct = new Set(candidates.map((c) => c.foId)).size;
    if (preferred && distinct === 1 && candidates[0]?.foId === preferred) {
      return "preferred_provider_only";
    }
    return "multi_provider_candidates";
  }

  async aggregateWindows(
    query: AvailabilityWindowsAggregateQueryDto,
  ): Promise<AggregatedAvailabilityResponse> {
    const maxProviders = query.maxProviders ?? 12;
    const preferred = await this.resolveEligiblePreferredFoId(
      query.preferredFoId?.trim() || null,
    );

    const candidates = await this.resolveAvailabilityProviderCandidates({
      preferredFoId: preferred,
      siteLat: query.siteLat,
      siteLng: query.siteLng,
      squareFootage: query.squareFootage,
      estimatedLaborMinutes: query.estimatedLaborMinutes ?? query.durationMinutes,
      recommendedTeamSize: query.recommendedTeamSize,
      maxProviders,
    });

    const mode = this.computeResponseMode(preferred, candidates);

    const raw: ProviderBackedAvailabilityWindow[] = [];

    for (const c of candidates) {
      try {
        const wins = await this.slotAvailability.listAvailableWindows({
          foId: c.foId,
          rangeStart: query.rangeStart,
          rangeEnd: query.rangeEnd,
          durationMinutes: query.durationMinutes,
        });
        const slotSource: ProviderBackedAvailabilityWindow["source"] =
          Boolean(preferred) && c.foId === preferred
            ? "preferred_provider"
            : "candidate_provider";

        for (const w of wins) {
          const startAt = w.startAt instanceof Date ? w.startAt : new Date(w.startAt);
          const endAt = w.endAt instanceof Date ? w.endAt : new Date(w.endAt);
          raw.push({
            foId: c.foId,
            cleanerId: c.cleanerId,
            cleanerLabel: c.cleanerLabel,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            windowLabel: this.formatWindowLabel(startAt, endAt),
            source: slotSource,
          });
        }
      } catch {
        /* skip FO on invalid range etc. */
      }
    }

    raw.sort((a, b) => {
      const pa = a.source === "preferred_provider" ? 0 : 1;
      const pb = b.source === "preferred_provider" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      const ta = new Date(a.startAt).getTime();
      const tb = new Date(b.startAt).getTime();
      if (ta !== tb) return ta - tb;
      return a.foId.localeCompare(b.foId);
    });

    return { mode, windows: raw };
  }
}
