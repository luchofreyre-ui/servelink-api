import { Injectable, NotFoundException } from "@nestjs/common";
import {
  SYSTEM_TEST_INCIDENT_VERSION,
  type SystemTestIncidentFixTrack,
} from "@servelink/system-test-intelligence";

import { PrismaService } from "../../prisma";
import type { SystemTestPersistedIntelligenceDto } from "../system-tests/dto/system-test-run-detail.dto";
import type {
  SystemTestIncidentDetailDto,
  SystemTestIncidentListItemDto,
  SystemTestIncidentMemberDto,
  SystemTestIncidentSummaryDto,
} from "./dto/system-test-incidents.dto";

function metaString(o: unknown, k: string): string | null {
  if (o == null || typeof o !== "object" || Array.isArray(o)) return null;
  const v = (o as Record<string, unknown>)[k];
  return typeof v === "string" ? v : null;
}

function mapFixTrackFromRow(row: {
  primaryArea: string;
  recommendedStepsJson: unknown;
  validationStepsJson: unknown;
  representativeFilesJson: unknown;
  representativeFamilyKeysJson: unknown;
}): SystemTestIncidentFixTrack {
  const rec = Array.isArray(row.recommendedStepsJson) ? row.recommendedStepsJson : [];
  const val = Array.isArray(row.validationStepsJson) ? row.validationStepsJson : [];
  const files = Array.isArray(row.representativeFilesJson) ? row.representativeFilesJson : [];
  const famKeys = Array.isArray(row.representativeFamilyKeysJson) ?
    row.representativeFamilyKeysJson
  : [];
  return {
    primaryArea: row.primaryArea as SystemTestIncidentFixTrack["primaryArea"],
    recommendedSteps: rec as string[],
    validationSteps: val as string[],
    representativeFiles: files as string[],
    representativeFamilyKeys: famKeys as string[],
    suggestedOwnerHint: null,
  };
}

@Injectable()
export class SystemTestsIncidentsReadService {
  constructor(private readonly prisma: PrismaService) {}

  async listIncidents(opts?: {
    limit?: number;
    status?: string;
    runId?: string;
  }): Promise<SystemTestIncidentListItemDto[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 80, 1), 200);
    const targetRunId =
      opts?.runId ??
      (
        await this.prisma.systemTestRun.findFirst({
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      )?.id;

    if (!targetRunId) {
      return [];
    }

    const statusFilter =
      opts?.status &&
      ["active", "monitoring", "quiet", "resolved_candidate"].includes(opts.status) ?
        opts.status
      : undefined;

    const where: {
      runId: string;
      incidentVersion: string;
      status?: string;
    } = {
      runId: targetRunId,
      incidentVersion: SYSTEM_TEST_INCIDENT_VERSION,
    };
    if (statusFilter) where.status = statusFilter;

    const rows = await this.prisma.systemTestIncident.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return rows.map((r) => ({
      runId: r.runId,
      incidentKey: r.incidentKey,
      incidentVersion: r.incidentVersion,
      displayTitle: r.displayTitle,
      rootCauseCategory: r.rootCauseCategory,
      summary: r.summary,
      severity: r.severity,
      status: r.status,
      trendKind: metaString(r.metadataJson, "trendKind") ?? "stable",
      leadFamilyId: r.leadFamilyId,
      affectedFamilyCount: r.affectedFamilyCount,
      affectedFileCount: r.affectedFileCount,
      currentRunFailureCount: r.currentRunFailureCount,
      lastSeenRunId: r.lastSeenRunId,
      firstSeenRunId: r.firstSeenRunId,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getIncidentDetailByKey(
    incidentKey: string,
    opts?: { runId?: string },
  ): Promise<SystemTestIncidentDetailDto> {
    const row =
      opts?.runId ?
        await this.prisma.systemTestIncident.findFirst({
          where: {
            incidentKey,
            runId: opts.runId,
            incidentVersion: SYSTEM_TEST_INCIDENT_VERSION,
          },
          include: {
            memberships: {
              include: { family: true },
            },
          },
        })
      : await this.prisma.systemTestIncident.findFirst({
          where: { incidentKey, incidentVersion: SYSTEM_TEST_INCIDENT_VERSION },
          orderBy: { run: { createdAt: "desc" } },
          include: {
            memberships: {
              include: { family: true },
            },
          },
        });

    if (!row) {
      throw new NotFoundException("SYSTEM_TEST_INCIDENT_NOT_FOUND");
    }

    const fixRow = await this.prisma.systemTestIncidentFixTrack.findUnique({
      where: { incidentKey },
    });

    const fixTrack: SystemTestIncidentFixTrack =
      fixRow ?
        mapFixTrackFromRow(fixRow)
      : {
          primaryArea: "unknown",
          recommendedSteps: [],
          validationSteps: [],
          representativeFiles: [],
          representativeFamilyKeys: [],
          suggestedOwnerHint: null,
        };

    const members: SystemTestIncidentMemberDto[] = row.memberships.map((m) => {
      const trendKind = metaString(m.family.metadataJson, "trendKind") ?? "stable";
      return {
        familyId: m.familyId,
        displayTitle: m.family.displayTitle,
        matchBasis: m.matchBasis,
        role: m.role,
        familyStatus: m.family.status,
        trendKind,
      };
    });

    members.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));

    return {
      runId: row.runId,
      incidentKey: row.incidentKey,
      incidentVersion: row.incidentVersion,
      displayTitle: row.displayTitle,
      rootCauseCategory: row.rootCauseCategory,
      summary: row.summary,
      severity: row.severity,
      status: row.status,
      trendKind: metaString(row.metadataJson, "trendKind") ?? "stable",
      leadFamilyId: row.leadFamilyId,
      affectedFamilyCount: row.affectedFamilyCount,
      affectedFileCount: row.affectedFileCount,
      currentRunFailureCount: row.currentRunFailureCount,
      lastSeenRunId: row.lastSeenRunId,
      firstSeenRunId: row.firstSeenRunId,
      updatedAt: row.updatedAt.toISOString(),
      fixTrack,
      metadataJson: row.metadataJson,
      members,
    };
  }

  /**
   * Attach compact incident summary to persisted groups when the group's family is in an incident
   * for the same run.
   */
  async enrichPersistedIntelligenceWithIncidents(
    runId: string,
    dto: SystemTestPersistedIntelligenceDto,
  ): Promise<SystemTestPersistedIntelligenceDto> {
    if (!dto.failureGroups.length) {
      return dto;
    }

    const familyIds = dto.failureGroups
      .map((g) => g.family?.familyId)
      .filter((id): id is string => Boolean(id));

    if (!familyIds.length) {
      return dto;
    }

    const memberships = await this.prisma.systemTestIncidentFamilyMembership.findMany({
      where: {
        familyId: { in: [...new Set(familyIds)] },
        incidentVersion: SYSTEM_TEST_INCIDENT_VERSION,
        incident: { runId },
      },
      include: { incident: true },
    });

    const incidentKeys = [...new Set(memberships.map((m) => m.incident.incidentKey))];
    const fixRows =
      incidentKeys.length > 0 ?
        await this.prisma.systemTestIncidentFixTrack.findMany({
          where: { incidentKey: { in: incidentKeys } },
        })
      : [];
    const fixByKey = new Map(fixRows.map((r) => [r.incidentKey, r]));

    const byFamilyId = new Map<string, SystemTestIncidentSummaryDto>();
    for (const m of memberships) {
      const inc = m.incident;
      const fixRow = fixByKey.get(inc.incidentKey);
      const primaryArea =
        fixRow?.primaryArea && typeof fixRow.primaryArea === "string" ? fixRow.primaryArea : "unknown";
      const steps = Array.isArray(fixRow?.recommendedStepsJson) ?
        (fixRow!.recommendedStepsJson as string[])
      : [];
      const firstStep = steps[0] ?? "—";

      byFamilyId.set(m.familyId, {
        incidentKey: inc.incidentKey,
        displayTitle: inc.displayTitle,
        severity: inc.severity,
        status: inc.status,
        trendKind: metaString(inc.metadataJson, "trendKind") ?? "stable",
        rootCauseCategory: inc.rootCauseCategory,
        leadFamilyId: inc.leadFamilyId,
        fixTrackPrimaryArea: primaryArea as SystemTestIncidentSummaryDto["fixTrackPrimaryArea"],
        fixTrackFirstStep: firstStep,
      });
    }

    return {
      ...dto,
      failureGroups: dto.failureGroups.map((g) => ({
        ...g,
        incident:
          g.family?.familyId ? (byFamilyId.get(g.family.familyId) ?? null) : null,
      })),
    };
  }
}
