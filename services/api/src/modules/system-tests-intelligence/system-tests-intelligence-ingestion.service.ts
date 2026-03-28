import { createHash } from "node:crypto";

import { Injectable, Logger, Optional } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { SystemTestCaseResult, SystemTestRun } from "@prisma/client";
import {
  SYSTEM_TEST_INTELLIGENCE_VERSION,
  buildChronologyDiagnostics,
  buildRunSourceContentPayload,
  buildSpecSummaryRows,
  casesByFingerprintKey,
  diagnosticPreviewForGroup,
  enrichRichEvidenceWithPrimary,
  filterFailedCases,
  groupFailures,
  intelCaseFromRow,
  mergeArtifactRefsForGroup,
  mergeEvidenceForGroup,
  mergeRichEvidenceForGroup,
  passRateFromRunRow,
  withSpecSortOrder,
} from "@servelink/system-test-intelligence";

import { PrismaService } from "../../prisma";
import { SystemTestsFamiliesSyncService } from "../system-tests-families/system-tests-families-sync.service";
import { SystemTestsIncidentsSyncService } from "../system-tests-incidents/system-tests-incidents-sync.service";
import {
  mapPrismaCaseToRowInput,
  mapPrismaRunToRowInput,
} from "./system-tests-intelligence-prisma-map";
import type { ChronologyDiagnosticsV1 } from "./system-tests-intelligence.types";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function fingerprintHash(canonicalKey: string): string {
  return sha256Hex(`${SYSTEM_TEST_INTELLIGENCE_VERSION}\0${canonicalKey}`);
}

export function computeRunSourceContentHash(
  run: SystemTestRun,
  cases: SystemTestCaseResult[],
): string {
  const payload = buildRunSourceContentPayload(
    mapPrismaRunToRowInput(run),
    cases.map(mapPrismaCaseToRowInput),
  );
  return sha256Hex(JSON.stringify(payload));
}

function pickMostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = values[0]!;
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

@Injectable()
export class SystemTestsIntelligenceIngestionService {
  private readonly log = new Logger(SystemTestsIntelligenceIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly familiesSync?: SystemTestsFamiliesSyncService,
    @Optional()
    private readonly incidentsSync?: SystemTestsIncidentsSyncService,
  ) {}

  async markAnalysisFailed(runId: string, errorMessage: string): Promise<void> {
    const run = await this.prisma.systemTestRun.findUnique({
      where: { id: runId },
    });
    if (!run) return;

    const short = errorMessage.slice(0, 8000);
    const passR = passRateFromRunRow(mapPrismaRunToRowInput(run));
    const emptyChronology: ChronologyDiagnosticsV1 = {
      version: "v1",
      runCreatedAtIso: run.createdAt.toISOString(),
      runUpdatedAtIso: run.updatedAt.toISOString(),
      caseOrderingBasis: "unavailable (analysis failed before chronology build)",
      parsedCaseTimestamps: [],
      duplicateTimestampGroups: [],
      warnings: [],
    };

    await this.prisma.systemTestRunIntelligence.upsert({
      where: { runId },
      create: {
        runId,
        ingestionVersion: SYSTEM_TEST_INTELLIGENCE_VERSION,
        sourceContentHash: "error",
        canonicalRunAt: run.createdAt,
        status: run.status,
        totalCount: run.totalCount,
        passedCount: run.passedCount,
        failedCount: run.failedCount,
        skippedCount: run.skippedCount,
        flakyCount: run.flakyCount,
        passRate: passR,
        durationMs: run.durationMs,
        branch: run.branch,
        commitSha: run.commitSha,
        chronologyJson: emptyChronology as unknown as Prisma.InputJsonValue,
        ingestionWarningsJson: [] as unknown as Prisma.InputJsonValue,
        analysisStatus: "failed",
        analysisError: short,
        lastAnalyzedAt: new Date(),
      },
      update: {
        ingestionVersion: SYSTEM_TEST_INTELLIGENCE_VERSION,
        analysisStatus: "failed",
        analysisError: short,
        lastAnalyzedAt: new Date(),
      },
    });
  }

  /**
   * Canonical persistence from shared intelligence package.
   * @returns created | updated | skipped | failed
   */
  async ingestRun(
    runId: string,
    opts?: { force?: boolean },
  ): Promise<"created" | "updated" | "skipped" | "failed"> {
    try {
      const run = await this.prisma.systemTestRun.findUnique({
        where: { id: runId },
        include: { cases: { orderBy: { id: "asc" } } },
      });

      if (!run) {
        throw new Error(`SYSTEM_TEST_RUN_NOT_FOUND:${runId}`);
      }

      const cases = run.cases;
      const caseInputs = cases.map(mapPrismaCaseToRowInput);
      const sourceContentHash = computeRunSourceContentHash(run, cases);

      const existing = await this.prisma.systemTestRunIntelligence.findUnique({
        where: { runId },
      });

      if (
        !opts?.force &&
        existing &&
        existing.sourceContentHash === sourceContentHash &&
        existing.ingestionVersion === SYSTEM_TEST_INTELLIGENCE_VERSION &&
        existing.analysisStatus === "completed"
      ) {
        return "skipped";
      }

      const chronology: ChronologyDiagnosticsV1 = buildChronologyDiagnostics(
        mapPrismaRunToRowInput(run),
        caseInputs,
      );
      const ingestionWarnings: string[] = [...chronology.warnings];

      const intelCases = caseInputs.map(intelCaseFromRow);
      const failureGroups = groupFailures(intelCases);
      const failedCases = filterFailedCases(caseInputs);

      const specRows = withSpecSortOrder(buildSpecSummaryRows(caseInputs));

      const groupRows = failureGroups.map((g, sortOrder) => {
        const members = casesByFingerprintKey(failedCases, g.key);
        const fullMessage =
          members
            .map((m) => m.errorMessage?.trim())
            .find((m) => m && m.length > 0) ?? null;
        const statuses = members.map((m) => m.status.toLowerCase());
        const finalStatus =
          statuses.length > 0 ? pickMostCommon(statuses) : null;

        const { refs } = mergeArtifactRefsForGroup(members);
        const rich = enrichRichEvidenceWithPrimary(
          mergeRichEvidenceForGroup(members),
          refs.find((r) => r.isPrimary) ?? null,
        );

        return {
          runId,
          canonicalKey: g.key,
          canonicalFingerprint: fingerprintHash(g.key),
          file: g.file,
          projectName: members[0]?.suite ?? null,
          title: g.title,
          shortMessage: g.shortMessage,
          fullMessage,
          finalStatus,
          occurrences: g.occurrences,
          testTitlesJson: g.testTitles as unknown as Prisma.InputJsonValue,
          evidenceSummaryJson: mergeEvidenceForGroup(
            members,
          ) as unknown as Prisma.InputJsonValue,
          diagnosticPreviewJson: {
            text: diagnosticPreviewForGroup(members),
          } as unknown as Prisma.InputJsonValue,
          richEvidenceJson: rich as unknown as Prisma.InputJsonValue,
          artifactRefsJson: refs as unknown as Prisma.InputJsonValue,
          sortOrder,
        };
      });

      const passR = passRateFromRunRow(mapPrismaRunToRowInput(run));
      const now = new Date();

      const priorMemberships =
        await this.prisma.systemTestFailureFamilyMembership.findMany({
          where: { runId },
          select: { familyId: true },
        });
      const priorFamilyIds = [
        ...new Set(priorMemberships.map((m) => m.familyId)),
      ];

      await this.prisma.$transaction(async (tx) => {
        if (existing) {
          await tx.systemTestFailureGroup.deleteMany({
            where: { runIntelligenceId: existing.id },
          });
          await tx.systemTestSpecSummary.deleteMany({
            where: { runIntelligenceId: existing.id },
          });
          await tx.systemTestRunIntelligence.update({
            where: { id: existing.id },
            data: {
              ingestionVersion: SYSTEM_TEST_INTELLIGENCE_VERSION,
              sourceContentHash,
              canonicalRunAt: run.createdAt,
              status: run.status,
              totalCount: run.totalCount,
              passedCount: run.passedCount,
              failedCount: run.failedCount,
              skippedCount: run.skippedCount,
              flakyCount: run.flakyCount,
              passRate: passR,
              durationMs: run.durationMs,
              branch: run.branch,
              commitSha: run.commitSha,
              chronologyJson: chronology as unknown as Prisma.InputJsonValue,
              ingestionWarningsJson:
                ingestionWarnings as unknown as Prisma.InputJsonValue,
              lastAnalyzedAt: now,
              analysisStatus: "completed",
              analysisError: null,
              failureGroups: { create: groupRows },
              specSummaries: {
                create: specRows.map((s) => ({
                  runId,
                  file: s.file,
                  totalCount: s.totalCount,
                  passedCount: s.passedCount,
                  failedCount: s.failedCount,
                  skippedCount: s.skippedCount,
                  passRate: s.passRate,
                  sortOrder: s.sortOrder,
                })),
              },
            },
          });
        } else {
          await tx.systemTestRunIntelligence.create({
            data: {
              runId,
              ingestionVersion: SYSTEM_TEST_INTELLIGENCE_VERSION,
              sourceContentHash,
              canonicalRunAt: run.createdAt,
              status: run.status,
              totalCount: run.totalCount,
              passedCount: run.passedCount,
              failedCount: run.failedCount,
              skippedCount: run.skippedCount,
              flakyCount: run.flakyCount,
              passRate: passR,
              durationMs: run.durationMs,
              branch: run.branch,
              commitSha: run.commitSha,
              chronologyJson: chronology as unknown as Prisma.InputJsonValue,
              ingestionWarningsJson:
                ingestionWarnings as unknown as Prisma.InputJsonValue,
              lastAnalyzedAt: now,
              analysisStatus: "completed",
              analysisError: null,
              failureGroups: { create: groupRows },
              specSummaries: {
                create: specRows.map((s) => ({
                  runId,
                  file: s.file,
                  totalCount: s.totalCount,
                  passedCount: s.passedCount,
                  failedCount: s.failedCount,
                  skippedCount: s.skippedCount,
                  passRate: s.passRate,
                  sortOrder: s.sortOrder,
                })),
              },
            },
          });
        }
      });

      await this.familiesSync?.syncFamiliesForRun(runId, priorFamilyIds);
      await this.incidentsSync?.syncIncidentsForRun(runId);

      return existing ? "updated" : "created";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Intelligence ingest failed for run ${runId}: ${msg}`);
      await this.markAnalysisFailed(runId, msg);
      return "failed";
    }
  }

  async ingestRunSafe(
    runId: string,
    opts?: { force?: boolean },
  ): Promise<"created" | "updated" | "skipped" | "failed"> {
    return this.ingestRun(runId, opts);
  }
}
