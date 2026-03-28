import { createHash } from "node:crypto";

import { Injectable, Logger } from "@nestjs/common";
import {
  SYSTEM_TEST_FAILURE_FAMILY_VERSION,
  buildFailureFamilyKeyMaterial,
  buildFamilyDisplayTitle,
  buildFamilyRootCauseSummary,
  computeFamilyStatus,
  computeFamilyTrendKind,
  countFamilyPresenceInWindow,
  formatFamilyRecurrenceLine,
  selectFailureFamilySignature,
} from "@servelink/system-test-intelligence";

import { PrismaService } from "../../prisma";
import { parseRichEvidenceFromJson } from "./system-tests-families.types";

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

@Injectable()
export class SystemTestsFamiliesSyncService {
  private readonly log = new Logger(SystemTestsFamiliesSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * After failure groups for a run are persisted. Idempotent per ingest.
   * Pass `priorFamilyIdsBeforeReplace` from the caller **before** failure groups are deleted
   * so aggregates refresh for families that lose this run's memberships (cascade).
   */
  async syncFamiliesForRun(
    runId: string,
    priorFamilyIdsBeforeReplace: string[] = [],
  ): Promise<void> {
    const intel = await this.prisma.systemTestRunIntelligence.findUnique({
      where: { runId },
      include: { failureGroups: true },
    });

    if (!intel || intel.analysisStatus !== "completed") {
      return;
    }

    const recomputeSet = new Set(priorFamilyIdsBeforeReplace);

    const version = SYSTEM_TEST_FAILURE_FAMILY_VERSION;
    for (const g of intel.failureGroups) {
      const rich = parseRichEvidenceFromJson(g.richEvidenceJson);
      const selected = selectFailureFamilySignature({
        file: g.file,
        shortMessage: g.shortMessage,
        rich,
      });

      if (!selected) {
        continue;
      }

      const familyKey = sha256Hex(buildFailureFamilyKeyMaterial(selected, version));
      const displayTitle = buildFamilyDisplayTitle(selected);
      const rootCauseSummary = buildFamilyRootCauseSummary(selected);

      const family = await this.prisma.systemTestFailureFamily.upsert({
        where: {
          familyKey_familyVersion: { familyKey, familyVersion: version },
        },
        create: {
          familyKey,
          familyVersion: version,
          familyKind: "layered_signature",
          displayTitle,
          rootCauseSummary,
          primaryAssertionType: selected.primaryAssertionType,
          primaryLocator: selected.primaryLocator,
          primarySelector: selected.primarySelector,
          primaryRouteUrl: selected.primaryRouteUrl,
          primaryActionName: selected.primaryActionName,
          primaryErrorCode: selected.primaryErrorCode,
        },
        update: {
          displayTitle,
          rootCauseSummary,
          primaryAssertionType: selected.primaryAssertionType,
          primaryLocator: selected.primaryLocator,
          primarySelector: selected.primarySelector,
          primaryRouteUrl: selected.primaryRouteUrl,
          primaryActionName: selected.primaryActionName,
          primaryErrorCode: selected.primaryErrorCode,
        },
      });

      await this.prisma.systemTestFailureFamilyMembership.upsert({
        where: {
          failureGroupId_familyVersion: {
            failureGroupId: g.id,
            familyVersion: version,
          },
        },
        create: {
          familyId: family.id,
          familyVersion: version,
          runId,
          failureGroupId: g.id,
          canonicalKey: g.canonicalKey,
          matchBasis: selected.matchBasis,
        },
        update: {
          familyId: family.id,
          matchBasis: selected.matchBasis,
          canonicalKey: g.canonicalKey,
        },
      });

      recomputeSet.add(family.id);
    }

    for (const fid of recomputeSet) {
      try {
        await this.recomputeFamilyAggregates(fid);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.log.warn(`Family aggregate recompute failed for ${fid}: ${msg}`);
      }
    }
  }

  async recomputeFamilyAggregates(familyId: string): Promise<void> {
    const memberships = await this.prisma.systemTestFailureFamilyMembership.findMany({
      where: { familyId },
      include: { failureGroup: true },
    });

    if (memberships.length === 0) {
      await this.prisma.systemTestFailureFamily.deleteMany({ where: { id: familyId } }).catch(() => undefined);
      return;
    }

    const runIds = [...new Set(memberships.map((m) => m.runId))];
    const files = [...new Set(memberships.map((m) => m.failureGroup.file))];
    let totalOcc = 0;
    for (const m of memberships) {
      totalOcc += m.failureGroup.occurrences;
    }

    const runs = await this.prisma.systemTestRun.findMany({
      where: { id: { in: runIds } },
      select: { id: true, createdAt: true },
    });
    const runOrder = [...runs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const firstSeenRunId = runOrder[0]?.id ?? null;
    const lastSeenRunId = runOrder[runOrder.length - 1]?.id ?? null;

    const recentRuns = await this.prisma.systemTestRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true },
    });
    const recentRunIdsNewestFirst = recentRuns.map((r) => r.id);

    const occurrencesByRunId = new Map<string, number>();
    for (const m of memberships) {
      const prev = occurrencesByRunId.get(m.runId) ?? 0;
      occurrencesByRunId.set(m.runId, prev + m.failureGroup.occurrences);
    }

    const trendKind = computeFamilyTrendKind({
      recentRunIdsNewestFirst,
      occurrencesByRunId,
      windowSize: 8,
    });

    const { seenRuns, windowRuns, totalOccurrencesInWindow } = countFamilyPresenceInWindow({
      recentRunIdsNewestFirst,
      occurrencesByRunId,
      windowSize: 8,
    });

    const status = computeFamilyStatus({
      recentRunIdsNewestFirst,
      lastSeenRunId,
    });

    await this.prisma.systemTestFailureFamily.update({
      where: { id: familyId },
      data: {
        firstSeenRunId,
        lastSeenRunId,
        totalOccurrencesAcrossRuns: totalOcc,
        affectedRunCount: runIds.length,
        affectedFileCount: files.length,
        status,
        metadataJson: {
          trendKind,
          seenInWindowRuns: seenRuns,
          windowRuns,
          recurrenceLine: formatFamilyRecurrenceLine(seenRuns, windowRuns),
          totalOccurrencesInWindow,
        },
      },
    });
  }
}
