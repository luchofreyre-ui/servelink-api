import { createHash } from "node:crypto";

import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import {
  SYSTEM_TEST_INCIDENT_VERSION,
  buildSynthesizedIncidentPayload,
  clusterFamiliesByIncidentEdges,
  evaluateIncidentFamilyPair,
  selectLeadFamilyId,
  type IncidentFamilyPairEdge,
  type IncidentSynthesisFamilyInput,
  type SystemTestIncidentFixTrack,
} from "@servelink/system-test-intelligence";

import { PrismaService } from "../../prisma";
import { SystemTestIncidentLifecycleService } from "../system-tests/system-test-incident-lifecycle.service";

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function metaString(o: unknown, k: string): string | null {
  if (o == null || typeof o !== "object" || Array.isArray(o)) return null;
  const v = (o as Record<string, unknown>)[k];
  return typeof v === "string" ? v : null;
}

function assertIncidentWritable(
  incidentKey: string,
  familyCount: number,
  fixTrack: SystemTestIncidentFixTrack,
): void {
  if (!incidentKey || incidentKey.length < 32) {
    throw new Error("SYSTEM_TEST_INCIDENT_INVARIANT: incidentKey missing or too short");
  }
  if (familyCount < 1) {
    throw new Error("SYSTEM_TEST_INCIDENT_INVARIANT: families.length must be > 0");
  }
  if (!fixTrack.recommendedSteps.length || !fixTrack.validationSteps.length) {
    throw new Error("SYSTEM_TEST_INCIDENT_INVARIANT: fixTrack steps missing");
  }
}

@Injectable()
export class SystemTestsIncidentsSyncService {
  private readonly log = new Logger(SystemTestsIncidentsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SystemTestIncidentLifecycleService))
    private readonly incidentLifecycle: SystemTestIncidentLifecycleService,
  ) {}

  /**
   * Deterministic incident synthesis after failure families are synced for a run.
   */
  async syncIncidentsForRun(runId: string): Promise<void> {
    const version = SYSTEM_TEST_INCIDENT_VERSION;

    const recentRuns = await this.prisma.systemTestRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, createdAt: true },
    });
    const recentRunIds = recentRuns.map((r) => r.id);
    if (!recentRunIds.length) return;

    const membershipsRecent = await this.prisma.systemTestFailureFamilyMembership.findMany({
      where: { runId: { in: recentRunIds } },
      select: { runId: true, familyId: true },
    });
    const familyIdsByRun = new Map<string, Set<string>>();
    for (const m of membershipsRecent) {
      if (!familyIdsByRun.has(m.runId)) familyIdsByRun.set(m.runId, new Set());
      familyIdsByRun.get(m.runId)!.add(m.familyId);
    }

    const cooccur = (fa: string, fb: string): number => {
      let n = 0;
      for (const rid of recentRunIds) {
        const s = familyIdsByRun.get(rid);
        if (s?.has(fa) && s?.has(fb)) n += 1;
      }
      return n;
    };

    const currentRunFamilyIds = new Set(
      (
        await this.prisma.systemTestFailureFamilyMembership.findMany({
          where: { runId },
          select: { familyId: true },
        })
      ).map((m) => m.familyId),
    );

    const activeFamilies = await this.prisma.systemTestFailureFamily.findMany({
      where: { status: "active" },
      include: {
        memberships: {
          take: 24,
          orderBy: { createdAt: "desc" },
          include: {
            failureGroup: { select: { file: true, occurrences: true } },
          },
        },
      },
    });

    const extraIds = [...currentRunFamilyIds].filter(
      (id) => !activeFamilies.some((f) => f.id === id),
    );
    const extraFamilies =
      extraIds.length > 0 ?
        await this.prisma.systemTestFailureFamily.findMany({
          where: { id: { in: extraIds } },
          include: {
            memberships: {
              take: 24,
              orderBy: { createdAt: "desc" },
              include: {
                failureGroup: { select: { file: true, occurrences: true } },
              },
            },
          },
        })
      : [];

    const allFamilies = [...activeFamilies, ...extraFamilies];
    const byId = new Map(allFamilies.map((f) => [f.id, f]));
    const candidateIds = [...byId.keys()].sort((a, b) => {
      const ka = byId.get(a)!.familyKey;
      const kb = byId.get(b)!.familyKey;
      const c = ka.localeCompare(kb);
      return c !== 0 ? c : a.localeCompare(b);
    });
    if (!candidateIds.length) {
      return;
    }

    const toInput = (row: (typeof allFamilies)[0]): IncidentSynthesisFamilyInput => {
      const files = [...new Set(row.memberships.map((m) => m.failureGroup.file))].sort((a, b) =>
        a.localeCompare(b),
      );
      const trendKind = metaString(row.metadataJson, "trendKind") ?? "stable";
      return {
        id: row.id,
        familyKey: row.familyKey,
        displayTitle: row.displayTitle,
        rootCauseSummary: row.rootCauseSummary,
        primaryRouteUrl: row.primaryRouteUrl,
        primaryLocator: row.primaryLocator,
        primarySelector: row.primarySelector,
        primaryActionName: row.primaryActionName,
        primaryErrorCode: row.primaryErrorCode,
        primaryAssertionType: row.primaryAssertionType,
        affectedRunCount: row.affectedRunCount,
        affectedFileCount: row.affectedFileCount,
        totalOccurrencesAcrossRuns: row.totalOccurrencesAcrossRuns,
        status: row.status,
        trendKind,
        sampleFiles: files,
      };
    };

    const edges: IncidentFamilyPairEdge[] = [];
    for (let i = 0; i < candidateIds.length; i += 1) {
      for (let j = i + 1; j < candidateIds.length; j += 1) {
        const a = byId.get(candidateIds[i]!)!;
        const b = byId.get(candidateIds[j]!)!;
        const ia = toInput(a);
        const ib = toInput(b);
        const bothInCurrent =
          currentRunFamilyIds.has(a.id) && currentRunFamilyIds.has(b.id);
        const { qualifies, strong, medium } = evaluateIncidentFamilyPair(
          ia,
          ib,
          cooccur(a.id, b.id),
          bothInCurrent,
        );
        if (!qualifies) continue;
        const bases = [...new Set([...strong, ...medium])].sort((x, y) =>
          x.localeCompare(y),
        ) as IncidentFamilyPairEdge["bases"];
        edges.push({ aId: a.id, bId: b.id, bases });
      }
    }

    edges.sort((e1, e2) => {
      const c = e1.aId.localeCompare(e2.aId);
      return c !== 0 ? c : e1.bId.localeCompare(e2.bId);
    });

    const clusters = clusterFamiliesByIncidentEdges(candidateIds, edges);

    type PreparedCluster = {
      incidentKey: string;
      payload: ReturnType<typeof buildSynthesizedIncidentPayload>;
      sortedFamilyIds: string[];
      firstSeenRunId: string | null;
      lastSeenRunId: string | null;
      affectedRunCount: number;
      affectedFileCount: number;
      currentRunFamilyCount: number;
      currentRunFailureCount: number;
    };

    const prepared: PreparedCluster[] = [];

    for (const cluster of clusters) {
      const membersUnordered = cluster.map((id) => toInput(byId.get(id)!));
      const members = [...membersUnordered].sort((a, b) => a.familyKey.localeCompare(b.familyKey));
      const memberIds = cluster;

      const allMems = await this.prisma.systemTestFailureFamilyMembership.findMany({
        where: { familyId: { in: memberIds } },
        select: { runId: true },
      });
      const distinctRuns = new Set(allMems.map((m) => m.runId));
      const affectedRunCount = distinctRuns.size;

      const allFiles = new Set<string>();
      for (const m of members) {
        for (const f of m.sampleFiles) allFiles.add(f);
      }
      const affectedFileCount = allFiles.size;

      const runIdsList = [...distinctRuns];
      const runsMeta = await this.prisma.systemTestRun.findMany({
        where: { id: { in: runIdsList } },
        select: { id: true, createdAt: true },
      });
      let lastSeenRunId: string | null = null;
      let bestT = 0;
      for (const r of runsMeta) {
        const t = r.createdAt.getTime();
        if (t >= bestT) {
          bestT = t;
          lastSeenRunId = r.id;
        }
      }
      let firstSeenRunId: string | null = null;
      let worstT = Number.POSITIVE_INFINITY;
      for (const r of runsMeta) {
        const t = r.createdAt.getTime();
        if (t <= worstT) {
          worstT = t;
          firstSeenRunId = r.id;
        }
      }

      const currentRunMems = await this.prisma.systemTestFailureFamilyMembership.findMany({
        where: { runId, familyId: { in: memberIds } },
        include: { failureGroup: { select: { occurrences: true } } },
      });
      const currentRunFailureCount = currentRunMems.reduce(
        (s, m) => s + m.failureGroup.occurrences,
        0,
      );
      const currentRunFamilyCount = new Set(currentRunMems.map((m) => m.familyId)).size;

      const leadForBandId = selectLeadFamilyId(members, currentRunFamilyIds);
      const leadForBand = members.find((m) => m.id === leadForBandId)!;
      const leadHighPriorityBand =
        leadForBand.affectedRunCount >= 5 ||
        leadForBand.trendKind === "worsening" ||
        leadForBand.trendKind === "reactivated";

      const payload = buildSynthesizedIncidentPayload({
        members,
        currentRunFamilyIds,
        edges,
        recentRunIdsNewestFirst: recentRunIds,
        lastSeenRunId,
        currentRunFailureCount,
        affectedRunCount,
        affectedFileCount,
        leadHighPriorityBand,
      });

      const incidentKey = sha256Hex(payload.incidentKeyMaterial);
      assertIncidentWritable(incidentKey, members.length, payload.fixTrack);

      const sortedFamilyIds = [...members]
        .sort((a, b) => a.familyKey.localeCompare(b.familyKey))
        .map((m) => m.id);

      prepared.push({
        incidentKey,
        payload,
        sortedFamilyIds,
        firstSeenRunId,
        lastSeenRunId,
        affectedRunCount,
        affectedFileCount,
        currentRunFamilyCount,
        currentRunFailureCount,
      });
    }

    const keysThisRun = new Set(prepared.map((p) => p.incidentKey));

    const currentRunRow = await this.prisma.systemTestRun.findUnique({
      where: { id: runId },
      select: { createdAt: true },
    });
    const priorRun =
      currentRunRow ?
        await this.prisma.systemTestRun.findFirst({
          where: { createdAt: { lt: currentRunRow.createdAt } },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      : null;

    const priorKeys =
      priorRun ?
        new Set(
          (
            await this.prisma.systemTestIncident.findMany({
              where: { runId: priorRun.id },
              select: { incidentKey: true },
            })
          ).map((r) => r.incidentKey),
        )
      : new Set<string>();

    const indexRows =
      keysThisRun.size > 0 ?
        await this.prisma.systemTestIncidentIndex.findMany({
          where: { incidentKey: { in: [...keysThisRun] } },
        })
      : [];
    const indexByKey = new Map(indexRows.map((r) => [r.incidentKey, r]));

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.systemTestIncident.deleteMany({ where: { runId } });

        if (keysThisRun.size > 0) {
          await tx.systemTestIncidentIndex.updateMany({
            where: { incidentKey: { notIn: [...keysThisRun] } },
            data: { lastSeenGapRuns: { increment: 1 } },
          });
        } else {
          await tx.systemTestIncidentIndex.updateMany({
            data: { lastSeenGapRuns: { increment: 1 } },
          });
        }

        for (const item of prepared) {
          const inPrior = priorKeys.has(item.incidentKey);
          const existed = indexByKey.get(item.incidentKey);
          const gapBefore = inPrior ? 0 : (existed?.lastSeenGapRuns ?? 0);
          const reappearedAfterGap = Boolean(!inPrior && existed && gapBefore > 0);

          const { payload } = item;
          const metadataJson = {
            trendKind: payload.trend,
            memberFamilyKeys: payload.sortedFamilyKeys,
            incidentKeyMaterial: payload.incidentKeyMaterial,
          };

          const incidentRow = await tx.systemTestIncident.create({
            data: {
              runId,
              incidentKey: item.incidentKey,
              incidentVersion: version,
              displayTitle: payload.displayTitle,
              rootCauseCategory: payload.rootCauseCategory,
              summary: payload.summary,
              severity: payload.severity,
              status: payload.status,
              firstSeenRunId: item.firstSeenRunId,
              lastSeenRunId: item.lastSeenRunId,
              affectedRunCount: item.affectedRunCount,
              affectedFamilyCount: payload.memberRoles.length,
              affectedFileCount: item.affectedFileCount,
              currentRunFamilyCount: item.currentRunFamilyCount,
              currentRunFailureCount: item.currentRunFailureCount,
              leadFamilyId: payload.leadFamilyId,
              metadataJson: metadataJson as object,
            },
          });

          for (const row of payload.memberRoles) {
            await tx.systemTestIncidentFamilyMembership.create({
              data: {
                incidentId: incidentRow.id,
                familyId: row.familyId,
                incidentVersion: version,
                matchBasis: row.matchBasis,
                role: row.role,
              },
            });
          }

          const ft = payload.fixTrack;
          const existingFt = await tx.systemTestIncidentFixTrack.findUnique({
            where: { incidentKey: item.incidentKey },
          });
          if (!existingFt) {
            await tx.systemTestIncidentFixTrack.create({
              data: {
                incidentKey: item.incidentKey,
                incidentVersion: version,
                primaryArea: ft.primaryArea,
                recommendedStepsJson: ft.recommendedSteps,
                validationStepsJson: ft.validationSteps,
                representativeFilesJson: ft.representativeFiles,
                representativeFamilyKeysJson: ft.representativeFamilyKeys,
              },
            });
          }

          await tx.systemTestIncidentIndex.upsert({
            where: { incidentKey: item.incidentKey },
            create: {
              incidentKey: item.incidentKey,
              firstSeenRunId: runId,
              lastSeenRunId: runId,
              occurrenceCount: 1,
              lastSeenGapRuns: 0,
            },
            update: {
              lastSeenRunId: runId,
              occurrenceCount: { increment: 1 },
              lastSeenGapRuns: 0,
            },
          });

          await tx.systemTestIncidentSnapshot.upsert({
            where: {
              incidentKey_runId: {
                incidentKey: item.incidentKey,
                runId,
              },
            },
            create: {
              incidentKey: item.incidentKey,
              runId,
              familyIdsJson: item.sortedFamilyIds,
              summary: payload.summary,
              severity: payload.severity,
              gapRunsBefore: gapBefore,
              reappearedAfterGap,
            },
            update: {
              familyIdsJson: item.sortedFamilyIds,
              summary: payload.summary,
              severity: payload.severity,
              gapRunsBefore: gapBefore,
              reappearedAfterGap,
            },
          });
        }
      });

      for (const incidentKey of keysThisRun) {
        await this.incidentLifecycle.syncIncidentActionFromRun({
          incidentKey,
          runId,
        });
      }
      await this.incidentLifecycle.evaluateResolvedActionsAfterRun({ runId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Incident sync failed for run ${runId}: ${msg}`);
    }
  }
}
