import { Injectable, NotFoundException } from "@nestjs/common";
import { SYSTEM_TEST_INCIDENT_VERSION } from "@servelink/system-test-intelligence";
import { SystemTestFamilyOperatorState } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";
import type {
  SystemTestFailureFamilySummaryDto,
  SystemTestPersistedIntelligenceDto,
} from "../system-tests/dto/system-test-run-detail.dto";
import type {
  SystemTestFamilyDetailDto,
  SystemTestFamilyListItemDto,
  SystemTestFamilyMembershipItemDto,
} from "./dto/system-test-families.dto";
import type { SystemTestFamilyLifecycleState } from "../system-tests/system-test-family-lifecycle";
import {
  previewMatchesCategoryFilter,
  previewMatchesConfidenceTierFilter,
  sortFamilyListRowsInPlace,
  type SystemTestFamilyListSortBy,
  type SystemTestResolutionConfidenceTier,
} from "../system-tests/system-test-resolution-preview-filters";
import { toResolutionPreviewOrNull } from "../system-tests/system-test-resolution-preview";
import { toSystemTestFamilyOperatorStateDto } from "../system-tests/system-test-family-operator-state";
import { SystemTestsFamilyResolutionService } from "../system-tests/system-tests-family-resolution.service";
import { SystemTestsFamilyLifecycleService } from "./system-tests-family-lifecycle.service";

function metaString(o: unknown, k: string): string | null {
  if (o == null || typeof o !== "object" || Array.isArray(o)) return null;
  const v = (o as Record<string, unknown>)[k];
  return typeof v === "string" ? v : null;
}

function metaNumber(o: unknown, k: string): number | null {
  if (o == null || typeof o !== "object" || Array.isArray(o)) return null;
  const v = (o as Record<string, unknown>)[k];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

@Injectable()
export class SystemTestsFamiliesReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly familyResolution: SystemTestsFamilyResolutionService,
    private readonly familyLifecycleSvc: SystemTestsFamilyLifecycleService,
  ) {}

  async listFamilies(opts?: {
    limit?: number;
    status?: string;
    diagnosisCategory?: string;
    confidenceTier?: SystemTestResolutionConfidenceTier;
    sortBy?: SystemTestFamilyListSortBy;
    sortDirection?: "asc" | "desc";
    showDismissed?: boolean;
    lifecycleState?: SystemTestFamilyLifecycleState;
    includeDormant?: boolean;
    includeResolved?: boolean;
  }): Promise<SystemTestFamilyListItemDto[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 60, 1), 200);
    const where: Prisma.SystemTestFailureFamilyWhereInput = {
      ...(opts?.status && ["active", "quiet", "resolved_candidate"].includes(opts.status) ?
        { status: opts.status }
      : {}),
    };
    if (!opts?.showDismissed) {
      where.operatorState = { not: SystemTestFamilyOperatorState.dismissed };
    }

    const sortBy = opts?.sortBy ?? "recent";
    const sortDirection = opts?.sortDirection ?? "desc";
    const categoryFilter = opts?.diagnosisCategory?.trim() || undefined;
    const tierFilter = opts?.confidenceTier;
    const lifecycleStateFilter = opts?.lifecycleState;
    const includeDormant = opts?.includeDormant ?? true;
    const includeResolved = opts?.includeResolved ?? false;

    const needsExpandedFetch =
      Boolean(categoryFilter || tierFilter || lifecycleStateFilter) ||
      sortBy !== "recent" ||
      sortDirection !== "desc";

    const fetchTake = needsExpandedFetch ? Math.min(500, Math.max(limit * 25, 120)) : limit;

    const rows = await this.prisma.systemTestFailureFamily.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: fetchTake,
    });

    const lifecycleMap = await this.familyLifecycleSvc.buildFamilyLifecycleMap(
      rows.map((f) => f.id),
    );

    const list = await Promise.all(
      rows.map(async (f) => {
        const trendKind = metaString(f.metadataJson, "trendKind") ?? "stable";
        const recurrenceLine = metaString(f.metadataJson, "recurrenceLine");

        let resolutionPreview: SystemTestFamilyListItemDto["resolutionPreview"] = null;
        try {
          const resolution = await this.familyResolution.getFamilyResolution(f.id);
          resolutionPreview = toResolutionPreviewOrNull(resolution);
        } catch {
          resolutionPreview = null;
        }

        return {
          id: f.id,
          familyKey: f.familyKey,
          displayTitle: f.displayTitle,
          status: f.status,
          trendKind,
          lastSeenRunId: f.lastSeenRunId,
          firstSeenRunId: f.firstSeenRunId,
          affectedRunCount: f.affectedRunCount,
          affectedFileCount: f.affectedFileCount,
          totalOccurrencesAcrossRuns: f.totalOccurrencesAcrossRuns,
          recurrenceLine,
          primaryAssertionType: f.primaryAssertionType,
          primaryLocator: f.primaryLocator,
          primaryRouteUrl: f.primaryRouteUrl,
          updatedAt: f.updatedAt.toISOString(),
          resolutionPreview,
          operatorState: toSystemTestFamilyOperatorStateDto(f),
          lifecycle: lifecycleMap.get(f.id)!,
        };
      }),
    );

    let filtered = list;
    if (categoryFilter) {
      filtered = filtered.filter((r) => previewMatchesCategoryFilter(r.resolutionPreview, categoryFilter));
    }
    if (tierFilter) {
      filtered = filtered.filter((r) =>
        previewMatchesConfidenceTierFilter(r.resolutionPreview, tierFilter),
      );
    }
    if (lifecycleStateFilter) {
      filtered = filtered.filter((r) => r.lifecycle.lifecycleState === lifecycleStateFilter);
    } else {
      filtered = filtered.filter((r) => {
        const s = r.lifecycle.lifecycleState;
        if (s === "resolved" && !includeResolved) return false;
        if (s === "dormant" && !includeDormant) return false;
        return true;
      });
    }

    sortFamilyListRowsInPlace(filtered, sortBy, sortDirection);

    return filtered.slice(0, limit);
  }

  async getFamilyDetail(id: string): Promise<SystemTestFamilyDetailDto> {
    const f = await this.prisma.systemTestFailureFamily.findUnique({
      where: { id },
      include: {
        memberships: {
          orderBy: { createdAt: "desc" },
          take: 80,
          include: { failureGroup: true },
        },
      },
    });

    if (!f) {
      throw new NotFoundException("SYSTEM_TEST_FAMILY_NOT_FOUND");
    }

    const lifecycleMap = await this.familyLifecycleSvc.buildFamilyLifecycleMap([id]);
    const lifecycle = lifecycleMap.get(id)!;

    const trendKind = metaString(f.metadataJson, "trendKind") ?? "stable";
    const recurrenceLine = metaString(f.metadataJson, "recurrenceLine");

    const memberships: SystemTestFamilyMembershipItemDto[] = f.memberships.map((m) => ({
      runId: m.runId,
      failureGroupId: m.failureGroupId,
      canonicalKey: m.canonicalKey,
      matchBasis: m.matchBasis,
      file: m.failureGroup.file,
      title: m.failureGroup.title,
      shortMessage: m.failureGroup.shortMessage.slice(0, 500),
      occurrences: m.failureGroup.occurrences,
      createdAt: m.createdAt.toISOString(),
    }));

    const incidentMembership = await this.prisma.systemTestIncidentFamilyMembership.findFirst({
      where: { familyId: id, incidentVersion: SYSTEM_TEST_INCIDENT_VERSION },
      orderBy: { incident: { run: { createdAt: "desc" } } },
      include: { incident: true },
    });

    const incidentStub =
      incidentMembership ?
        {
          incidentKey: incidentMembership.incident.incidentKey,
          displayTitle: incidentMembership.incident.displayTitle,
          severity: incidentMembership.incident.severity,
          status: incidentMembership.incident.status,
          role: incidentMembership.role,
        }
      : null;

    return {
      id: f.id,
      familyKey: f.familyKey,
      familyVersion: f.familyVersion,
      familyKind: f.familyKind,
      displayTitle: f.displayTitle,
      rootCauseSummary: f.rootCauseSummary,
      primaryAssertionType: f.primaryAssertionType,
      primaryLocator: f.primaryLocator,
      primarySelector: f.primarySelector,
      primaryRouteUrl: f.primaryRouteUrl,
      primaryActionName: f.primaryActionName,
      primaryErrorCode: f.primaryErrorCode,
      firstSeenRunId: f.firstSeenRunId,
      lastSeenRunId: f.lastSeenRunId,
      totalOccurrencesAcrossRuns: f.totalOccurrencesAcrossRuns,
      affectedRunCount: f.affectedRunCount,
      affectedFileCount: f.affectedFileCount,
      status: f.status,
      trendKind,
      recurrenceLine,
      metadataJson: f.metadataJson,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      memberships,
      incident: incidentStub,
      operatorState: toSystemTestFamilyOperatorStateDto(f),
      lifecycle,
    };
  }

  async enrichPersistedIntelligence(
    runId: string,
    dto: SystemTestPersistedIntelligenceDto,
  ): Promise<SystemTestPersistedIntelligenceDto> {
    if (!dto.failureGroups.length) {
      return dto;
    }

    const keys = dto.failureGroups.map((g) => g.canonicalKey);
    const memberships = await this.prisma.systemTestFailureFamilyMembership.findMany({
      where: {
        runId,
        canonicalKey: { in: keys },
      },
      include: { family: true },
    });

    const byKey = new Map<string, SystemTestFailureFamilySummaryDto>();
    for (const m of memberships) {
      const trendKind = metaString(m.family.metadataJson, "trendKind") ?? "stable";
      const recurrenceLine = metaString(m.family.metadataJson, "recurrenceLine");
      const seenW = metaNumber(m.family.metadataJson, "seenInWindowRuns");
      const winR = metaNumber(m.family.metadataJson, "windowRuns");
      const seenInWindowLabel =
        seenW != null && winR != null ? `${seenW}/${winR}` : "—";

      const summary: SystemTestFailureFamilySummaryDto = {
        familyId: m.family.id,
        displayTitle: m.family.displayTitle,
        rootCauseSummary: m.family.rootCauseSummary,
        matchBasis: m.matchBasis,
        status: m.family.status,
        trendKind,
        seenInWindowLabel,
        recurrenceLine: recurrenceLine ?? "—",
      };
      byKey.set(m.canonicalKey, summary);
    }

    return {
      ...dto,
      failureGroups: dto.failureGroups.map((g) => ({
        ...g,
        family: byKey.get(g.canonicalKey) ?? null,
      })),
    };
  }
}
