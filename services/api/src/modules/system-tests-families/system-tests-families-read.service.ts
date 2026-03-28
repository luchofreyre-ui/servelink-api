import { Injectable, NotFoundException } from "@nestjs/common";
import { SYSTEM_TEST_INCIDENT_VERSION } from "@servelink/system-test-intelligence";

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
  constructor(private readonly prisma: PrismaService) {}

  async listFamilies(opts?: {
    limit?: number;
    status?: string;
  }): Promise<SystemTestFamilyListItemDto[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 60, 1), 200);
    const where =
      opts?.status && ["active", "quiet", "resolved_candidate"].includes(opts.status) ?
        { status: opts.status }
      : {};

    const rows = await this.prisma.systemTestFailureFamily.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return rows.map((f) => {
      const trendKind = metaString(f.metadataJson, "trendKind") ?? "stable";
      const recurrenceLine = metaString(f.metadataJson, "recurrenceLine");
      return {
        id: f.id,
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
      };
    });
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
