import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { SystemTestRunDetailResponseDto } from "../system-tests/dto/system-test-run-detail.dto";
import { SystemTestsService } from "../system-tests/system-tests.service";
import { SystemTestsIntelligenceService } from "../system-tests-intelligence/system-tests-intelligence.service";
import { evaluateRegressionAlertPolicy } from "./system-tests-alert-policy";
import type {
  AutomationJobPayloadEnvelope,
  DigestStructuredPayload,
  RegressionAlertStructuredPayload,
  SystemTestDeliveryPayload,
} from "./system-tests-automation.types";
import { SystemTestsDeliveryService } from "./system-tests-delivery.service";
import type { FailureGroup, IntelCase, IntelRunSnapshot } from "./system-tests-intelligence";
import {
  buildImmediatePriorMaps,
  compareFailureGroups,
  fileFailedDeltaMap,
  groupFailures,
  passRate,
  rerunScoreForGroup,
  stableFileSharpRegression,
  unstableFilesFromRuns,
} from "./system-tests-intelligence";
import { SystemTestsReportJobsService } from "./system-tests-report-jobs.service";

function cooldownMs(): number {
  const h = Number(process.env.SYSTEM_TEST_ALERT_COOLDOWN_HOURS ?? 12);
  const hours = Number.isFinite(h) && h > 0 ? h : 12;
  return hours * 3600_000;
}

function digestCooldownMs(): number {
  const h = Number(process.env.SYSTEM_TEST_DIGEST_COOLDOWN_HOURS ?? 18);
  const hours = Number.isFinite(h) && h > 0 ? h : 18;
  return hours * 3600_000;
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toIntelCase(c: SystemTestRunDetailResponseDto["cases"][number]): IntelCase {
  return {
    filePath: c.filePath,
    suite: c.suite,
    title: c.title,
    fullName: c.fullName,
    status: c.status,
    errorMessage: c.errorMessage,
    errorStack: c.errorStack,
  };
}

function toRunSnapshot(run: SystemTestRunDetailResponseDto["run"]): IntelRunSnapshot {
  return {
    id: run.id,
    createdAt: run.createdAt,
    status: run.status,
    totalCount: run.totalCount,
    passedCount: run.passedCount,
    failedCount: run.failedCount,
    skippedCount: run.skippedCount,
    durationMs: run.durationMs,
    branch: run.branch,
    commitSha: run.commitSha,
  };
}

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function buildRegressionDedupeKey(
  targetId: string,
  baseId: string,
  headline: string,
  newGroupKeys: string[],
): string {
  const head = headline.replace(/\s+/g, "_").slice(0, 120);
  const keys = [...newGroupKeys].sort().slice(0, 8).join(",");
  const raw = `regression_alert|${targetId}|${baseId}|${head}|${keys}`;
  return raw.length > 480 ? raw.slice(0, 480) : raw;
}

function buildDigestDedupeKey(targetId: string, day: string): string {
  return `digest|${targetId}|${day}`;
}

@Injectable()
export class SystemTestsAutomationService {
  constructor(
    private readonly systemTests: SystemTestsService,
    private readonly jobs: SystemTestsReportJobsService,
    private readonly delivery: SystemTestsDeliveryService,
    private readonly systemTestIntelligence: SystemTestsIntelligenceService,
  ) {}

  /** Prefer persisted failure groups; derive from cases when not ingested yet. */
  private async failureGroupsForRun(
    runId: string,
    cases: SystemTestRunDetailResponseDto["cases"],
  ): Promise<FailureGroup[]> {
    const persisted =
      await this.systemTestIntelligence.getFailureGroupsForRun(runId);
    if (persisted !== null) return persisted;
    return groupFailures(cases.map(toIntelCase));
  }

  schedulerEnabled(): boolean {
    return process.env.SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED === "1";
  }

  digestCronDescription(): string {
    return (
      process.env.SYSTEM_TEST_DIGEST_CRON_DESCRIPTION ??
      "Daily 13:00 UTC (override SYSTEM_TEST_DIGEST_CRON in scheduler code / env doc)."
    );
  }

  regressionCronDescription(): string {
    return (
      process.env.SYSTEM_TEST_REGRESSION_CRON_DESCRIPTION ??
      "Every 6 hours at minute 0 UTC (see SystemTestsAutomationScheduler)."
    );
  }

  webhookConfigured(): boolean {
    return Boolean(process.env.SYSTEM_TEST_AUTOMATION_WEBHOOK_URL?.trim());
  }

  /**
   * Phase 6: after canonical analysis completes for the HEAD run, run regression evaluation
   * immediately (cooldown/dedupe inside evaluateRegressionAlert still applies).
   */
  async onRunIntelligenceReady(runId: string): Promise<void> {
    const head = await this.systemTests.listRuns({ limit: 1, page: 1 });
    if (!head.items[0] || head.items[0].id !== runId) {
      return;
    }
    await this.evaluateRegressionAlert({ triggerSource: "schedule" });
  }

  async getStatus() {
    const since = new Date(Date.now() - 24 * 3600_000);
    const counts = await this.jobs.countSince(since);
    const [lastDigest, lastRegression] = await Promise.all([
      this.jobs.latestJobOfType("digest"),
      this.jobs.latestJobOfType("regression_alert"),
    ]);

    return {
      schedulerEnabled: this.schedulerEnabled(),
      digestScheduleDescription: this.digestCronDescription(),
      regressionScheduleDescription: this.regressionCronDescription(),
      webhookConfigured: this.webhookConfigured(),
      cooldownHours: cooldownMs() / 3600_000,
      digestCooldownHours: digestCooldownMs() / 3600_000,
      countsLast24h: counts,
      lastDigestAt: lastDigest?.createdAt.toISOString() ?? null,
      lastRegressionAt: lastRegression?.createdAt.toISOString() ?? null,
    };
  }

  async getJobDetail(jobId: string) {
    const j = await this.jobs.getById(jobId);
    if (!j) return null;
    return {
      id: j.id,
      createdAt: j.createdAt.toISOString(),
      type: j.type,
      status: j.status,
      triggerSource: j.triggerSource,
      targetRunId: j.targetRunId,
      baseRunId: j.baseRunId,
      reportKind: j.reportKind,
      headline: j.headline,
      shortSummary: j.shortSummary,
      dedupeKey: j.dedupeKey,
      suppressionReason: j.suppressionReason,
      generatedAt: j.generatedAt?.toISOString() ?? null,
      sentAt: j.sentAt?.toISOString() ?? null,
      failureReason: j.failureReason,
      payloadJson: j.payloadJson,
    };
  }

  async listJobs(limit: number) {
    const rows = await this.jobs.listRecent(limit);
    return rows.map((j) => ({
      id: j.id,
      createdAt: j.createdAt.toISOString(),
      type: j.type,
      status: j.status,
      triggerSource: j.triggerSource,
      targetRunId: j.targetRunId,
      baseRunId: j.baseRunId,
      reportKind: j.reportKind,
      headline: j.headline,
      shortSummary: j.shortSummary,
      dedupeKey: j.dedupeKey,
      suppressionReason: j.suppressionReason,
      generatedAt: j.generatedAt?.toISOString() ?? null,
      sentAt: j.sentAt?.toISOString() ?? null,
      failureReason: j.failureReason,
      payloadPreview: summarizePayload(j.payloadJson),
    }));
  }

  async runDigest(params: { triggerSource: "schedule" | "manual" | "test" }) {
    const list = await this.systemTests.listRuns({ limit: 10, page: 1 });
    if (!list.items.length) {
      const envelope = this.buildEmptyDigestEnvelope("No runs ingested yet.");
      const job = await this.jobs.createJob({
        type: "digest",
        status: "generated",
        triggerSource: params.triggerSource,
        reportKind: "digest",
        headline: "Empty digest",
        shortSummary: "No system test runs available.",
        dedupeKey: `digest|empty|${utcDayKey(new Date())}`,
        payloadJson: envelope as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      });
      return { jobId: job.id, status: job.status, envelope };
    }

    const details: SystemTestRunDetailResponseDto[] = [];
    for (const item of list.items) {
      details.push(await this.systemTests.getRunDetail(item.id));
    }

    details.sort(
      (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
    );

    const latest = details[details.length - 1]!;
    const prior = details.length >= 2 ? details[details.length - 2]! : null;

    const latestSnap = toRunSnapshot(latest.run);
    const latestGroups = await this.failureGroupsForRun(
      latest.run.id,
      latest.cases,
    );
    const priorSnap = prior ? toRunSnapshot(prior.run) : null;
    const comparison =
      prior ?
        compareFailureGroups({
          run: priorSnap!,
          groups: await this.failureGroupsForRun(prior.run.id, prior.cases),
        }, { run: latestSnap, groups: latestGroups })
      : null;

    const runCases = details.map((d) => d.cases.map(toIntelCase));
    const unstable = unstableFilesFromRuns(runCases, 10);

    const priorForRerun =
      prior ?
        await this.failureGroupsForRun(prior.run.id, prior.cases)
      : [];
    const { priorKeys, immediatePriorOcc } = buildImmediatePriorMaps(latestGroups, priorForRerun);
    const fdm = prior
      ? fileFailedDeltaMap(latest.cases.map(toIntelCase), prior.cases.map(toIntelCase))
      : new Map<string, number>();

    const scored = latestGroups.map((g) => ({
      g,
      ...rerunScoreForGroup(g, priorKeys, immediatePriorOcc, fdm),
    }));
    scored.sort((a, b) => b.score - a.score);
    const topRerun = scored.slice(0, 5).map((s) => ({
      title: s.g.title,
      file: s.g.file,
      score: s.score,
    }));

    const topChanges: string[] = [];
    if (comparison) {
      topChanges.push(`Headline: ${comparison.headline}`);
      topChanges.push(`New failure groups: ${comparison.newGroups.length}`);
      topChanges.push(`Resolved failure groups: ${comparison.resolvedGroups.length}`);
      topChanges.push(`Failed delta (target − base): ${comparison.failedDelta}`);
      topChanges.push(`Pass rate delta: ${(comparison.passRateDelta * 100).toFixed(2)} pts`);
    } else {
      topChanges.push("No prior run loaded for comparison in this digest window.");
    }

    const digest: DigestStructuredPayload = {
      latestRunId: latestSnap.id,
      latestStatus: latestSnap.status,
      passRatePct: fmtPct(passRate(latestSnap)),
      failedCount: latestSnap.failedCount,
      durationMs: latestSnap.durationMs,
      deltaVsPrevious: {
        passRateDeltaPct: comparison ? (comparison.passRateDelta * 100).toFixed(2) : "—",
        failedDelta: comparison ? comparison.failedDelta : 0,
        previousRunId: priorSnap?.id ?? null,
      },
      topChanges,
      topRerunPriorities: topRerun,
      unstableFiles: unstable,
      links: {
        dashboard: "/admin/system-tests",
        compare:
          priorSnap ?
            `/admin/system-tests/compare?baseRunId=${encodeURIComponent(priorSnap.id)}&targetRunId=${encodeURIComponent(latestSnap.id)}`
          : null,
        runDetail: `/admin/system-tests/${latestSnap.id}`,
      },
      generatedAt: new Date().toISOString(),
    };

    const bodyText = this.formatDigestBodyText(digest);
    const dedupeKey = buildDigestDedupeKey(latestSnap.id, utcDayKey(new Date()));

    const blocking = await this.jobs.findBlockingJob({
      dedupeKey,
      type: "digest",
      since: new Date(Date.now() - digestCooldownMs()),
    });

    if (blocking && params.triggerSource === "schedule") {
      const envelope: AutomationJobPayloadEnvelope = {
        version: 1,
        delivery: this.buildDeliveryStub(
          "info",
          `Digest suppressed: ${dedupeKey}`,
          bodyText,
          dedupeKey,
          digest,
        ),
        digest,
      };
      const job = await this.jobs.createJob({
        type: "digest",
        status: "suppressed",
        triggerSource: params.triggerSource,
        targetRunId: latestSnap.id,
        reportKind: "digest",
        headline: "Digest suppressed (cooldown)",
        shortSummary: `Duplicate digest key within cooldown: ${dedupeKey}`,
        dedupeKey,
        suppressionReason: `Prior job ${blocking.id} at ${blocking.createdAt.toISOString()}`,
        payloadJson: envelope as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      });
      return { jobId: job.id, status: job.status, envelope, suppressed: true };
    }

    const envelope: AutomationJobPayloadEnvelope = {
      version: 1,
      delivery: this.buildDeliveryStub(
        "info",
        `System test digest — ${digest.latestRunId.slice(0, 8)}…`,
        bodyText,
        dedupeKey,
        digest,
      ),
      digest,
    };

    const job = await this.jobs.createJob({
      type: "digest",
      status: "generated",
      triggerSource: params.triggerSource,
      targetRunId: latestSnap.id,
      reportKind: "digest",
      headline: "Daily digest",
      shortSummary: topChanges.slice(0, 3).join(" · "),
      dedupeKey,
      payloadJson: envelope as unknown as Prisma.InputJsonValue,
      generatedAt: new Date(),
    });

    const send = await this.delivery.deliver(envelope);
    if (send.ok) {
      await this.jobs.updateJob(job.id, {
        status: "sent",
        sentAt: new Date(),
      });
      return { jobId: job.id, status: "sent" as const, envelope };
    }
    await this.jobs.updateJob(job.id, {
      status: "failed",
      failureReason: send.error ?? "delivery_failed",
    });
    return { jobId: job.id, status: "failed" as const, envelope, error: send.error };
  }

  async evaluateRegressionAlert(params: { triggerSource: "schedule" | "manual" | "test" }) {
    const list = await this.systemTests.listRuns({ limit: 5, page: 1 });
    if (list.items.length < 2) {
      const envelope = this.buildMinimalRegressionEnvelope(
        "Not enough runs",
        "At least two runs are required for regression detection.",
        "insufficient_runs",
      );
      const job = await this.jobs.createJob({
        type: "regression_alert",
        status: "suppressed",
        triggerSource: params.triggerSource,
        reportKind: "comparison",
        headline: "Skipped",
        shortSummary: "Fewer than two runs ingested.",
        dedupeKey: `regression_alert|insufficient|${utcDayKey(new Date())}`,
        suppressionReason: "INSUFFICIENT_RUNS",
        payloadJson: envelope as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      });
      return { jobId: job.id, status: job.status, envelope, suppressed: true };
    }

    const [newest, older] = [list.items[0]!, list.items[1]!];
    let targetDetail = await this.systemTests.getRunDetail(newest.id);
    let baseDetail = await this.systemTests.getRunDetail(older.id);

    const tTime = new Date(targetDetail.run.createdAt).getTime();
    const bTime = new Date(baseDetail.run.createdAt).getTime();
    if (Number.isFinite(tTime) && Number.isFinite(bTime) && tTime < bTime) {
      const tmp = targetDetail;
      targetDetail = baseDetail;
      baseDetail = tmp;
    }

    const baseSnap = toRunSnapshot(baseDetail.run);
    const targetSnap = toRunSnapshot(targetDetail.run);
    const baseGroups = await this.failureGroupsForRun(
      baseDetail.run.id,
      baseDetail.cases,
    );
    const targetGroups = await this.failureGroupsForRun(
      targetDetail.run.id,
      targetDetail.cases,
    );
    const comparison = compareFailureGroups(
      { run: baseSnap, groups: baseGroups },
      { run: targetSnap, groups: targetGroups },
    );

    const { priorKeys, immediatePriorOcc } = buildImmediatePriorMaps(
      targetGroups,
      baseGroups,
    );
    const fdm = fileFailedDeltaMap(
      targetDetail.cases.map(toIntelCase),
      baseDetail.cases.map(toIntelCase),
    );

    let highPriorityFailureCount = 0;
    const rerunDetails: RegressionAlertStructuredPayload["topHighPriorityReruns"] = [];
    for (const g of targetGroups) {
      const { score, reasons } = rerunScoreForGroup(g, priorKeys, immediatePriorOcc, fdm);
      if (score >= 40) {
        highPriorityFailureCount += 1;
        if (rerunDetails.length < 5) {
          rerunDetails.push({
            key: g.key,
            title: g.title,
            file: g.file,
            score,
            reasons,
          });
        }
      }
    }
    rerunDetails.sort((a, b) => b.score - a.score);
    const topReruns = rerunDetails.slice(0, 3);

    const sharp = stableFileSharpRegression(
      baseDetail.cases.map(toIntelCase),
      targetDetail.cases.map(toIntelCase),
    );

    const policy = evaluateRegressionAlertPolicy({
      newFailureGroupCount: comparison.newGroups.length,
      failedDelta: comparison.failedDelta,
      passRateDelta: comparison.passRateDelta,
      highPriorityFailureCount,
      stableFileSharpRegression: sharp,
    });

    const newKeys = comparison.newGroups.map((g) => g.key);
    const dedupeKey = buildRegressionDedupeKey(
      targetSnap.id,
      baseSnap.id,
      comparison.headline,
      newKeys,
    );

    if (!policy.shouldAlert) {
      const reg: RegressionAlertStructuredPayload = {
        title: "No regression alert",
        severity: "info",
        targetRunId: targetSnap.id,
        baseRunId: baseSnap.id,
        headline: comparison.headline,
        summaryBullets: ["Policy thresholds not met."],
        topNewFailures: comparison.newGroups.slice(0, 3).map((g) => ({
          key: g.key,
          title: g.title,
          file: g.file,
          shortMessage: g.shortMessage,
        })),
        topHighPriorityReruns: topReruns,
        comparePath: `/admin/system-tests/compare?baseRunId=${encodeURIComponent(baseSnap.id)}&targetRunId=${encodeURIComponent(targetSnap.id)}`,
        dashboardPath: "/admin/system-tests",
        runDetailPath: `/admin/system-tests/${targetSnap.id}`,
        generatedAt: new Date().toISOString(),
      };
      const envelope: AutomationJobPayloadEnvelope = {
        version: 1,
        delivery: this.buildDeliveryStub(
          "info",
          "Regression check — no alert",
          policy.reasons.join("\n") || "No signal",
          dedupeKey,
          reg,
        ),
        regression: reg,
      };
      const job = await this.jobs.createJob({
        type: "regression_alert",
        status: "suppressed",
        triggerSource: params.triggerSource,
        targetRunId: targetSnap.id,
        baseRunId: baseSnap.id,
        reportKind: "comparison",
        headline: comparison.headline,
        shortSummary: "Thresholds not met",
        dedupeKey,
        suppressionReason: "POLICY_NOT_MET",
        payloadJson: envelope as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      });
      return { jobId: job.id, status: job.status, envelope, suppressed: true };
    }

    const blocking = await this.jobs.findBlockingJob({
      dedupeKey,
      type: "regression_alert",
      since: new Date(Date.now() - cooldownMs()),
    });

    if (blocking) {
      const reg: RegressionAlertStructuredPayload = {
        title: "Regression alert suppressed (cooldown)",
        severity: "warning",
        targetRunId: targetSnap.id,
        baseRunId: baseSnap.id,
        headline: comparison.headline,
        summaryBullets: policy.reasons,
        topNewFailures: comparison.newGroups.slice(0, 3).map((g) => ({
          key: g.key,
          title: g.title,
          file: g.file,
          shortMessage: g.shortMessage,
        })),
        topHighPriorityReruns: topReruns,
        comparePath: `/admin/system-tests/compare?baseRunId=${encodeURIComponent(baseSnap.id)}&targetRunId=${encodeURIComponent(targetSnap.id)}`,
        dashboardPath: "/admin/system-tests",
        runDetailPath: `/admin/system-tests/${targetSnap.id}`,
        generatedAt: new Date().toISOString(),
      };
      const envelope: AutomationJobPayloadEnvelope = {
        version: 1,
        delivery: this.buildDeliveryStub(
          "warning",
          `Suppressed regression alert (${dedupeKey})`,
          policy.reasons.join("\n"),
          dedupeKey,
          reg,
        ),
        regression: reg,
      };
      const job = await this.jobs.createJob({
        type: "regression_alert",
        status: "suppressed",
        triggerSource: params.triggerSource,
        targetRunId: targetSnap.id,
        baseRunId: baseSnap.id,
        reportKind: "comparison",
        headline: comparison.headline,
        shortSummary: policy.reasons[0] ?? "Cooldown",
        dedupeKey,
        suppressionReason: `Duplicate within cooldown (prior ${blocking.id})`,
        payloadJson: envelope as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      });
      return { jobId: job.id, status: job.status, envelope, suppressed: true };
    }

    const reg: RegressionAlertStructuredPayload = {
      title: `Regression: ${comparison.headline}`,
      severity: "critical",
      targetRunId: targetSnap.id,
      baseRunId: baseSnap.id,
      headline: comparison.headline,
      summaryBullets: policy.reasons,
      topNewFailures: comparison.newGroups.slice(0, 3).map((g) => ({
        key: g.key,
        title: g.title,
        file: g.file,
        shortMessage: g.shortMessage,
      })),
      topHighPriorityReruns: topReruns,
      comparePath: `/admin/system-tests/compare?baseRunId=${encodeURIComponent(baseSnap.id)}&targetRunId=${encodeURIComponent(targetSnap.id)}`,
      dashboardPath: "/admin/system-tests",
      runDetailPath: `/admin/system-tests/${targetSnap.id}`,
      generatedAt: new Date().toISOString(),
    };

    const bodyText = [
      reg.title,
      "",
      ...reg.summaryBullets.map((b) => `• ${b}`),
      "",
      `Compare: ${reg.comparePath}`,
      `Run: ${reg.runDetailPath}`,
    ].join("\n");

    const envelope: AutomationJobPayloadEnvelope = {
      version: 1,
      delivery: this.buildDeliveryStub(
        "critical",
        reg.title,
        bodyText,
        dedupeKey,
        reg,
      ),
      regression: reg,
    };

    const job = await this.jobs.createJob({
      type: "regression_alert",
      status: "generated",
      triggerSource: params.triggerSource,
      targetRunId: targetSnap.id,
      baseRunId: baseSnap.id,
      reportKind: "comparison",
      headline: comparison.headline,
      shortSummary: policy.reasons[0] ?? "Regression",
      dedupeKey,
      payloadJson: envelope as unknown as Prisma.InputJsonValue,
      generatedAt: new Date(),
    });

    const send = await this.delivery.deliver(envelope);
    if (send.ok) {
      await this.jobs.updateJob(job.id, { status: "sent", sentAt: new Date() });
      return { jobId: job.id, status: "sent" as const, envelope };
    }
    await this.jobs.updateJob(job.id, {
      status: "failed",
      failureReason: send.error ?? "delivery_failed",
    });
    return { jobId: job.id, status: "failed" as const, envelope, error: send.error };
  }

  async generateTriage(params: { triggerSource: "schedule" | "manual" | "test" }) {
    const list = await this.systemTests.listRuns({ limit: 10, page: 1 });
    if (!list.items.length) {
      throw new NotFoundException("NO_RUNS");
    }
    const latestId = list.items[0]!.id;
    const detail = await this.systemTests.getRunDetail(latestId);
    const priors: SystemTestRunDetailResponseDto[] = [];
    for (let i = 1; i < list.items.length && priors.length < 9; i++) {
      priors.push(await this.systemTests.getRunDetail(list.items[i]!.id));
    }

    const latestSnap = toRunSnapshot(detail.run);
    const groups = await this.failureGroupsForRun(detail.run.id, detail.cases);
    const priorGroupsList = await Promise.all(
      priors.map((p) => this.failureGroupsForRun(p.run.id, p.cases)),
    );
    const immediatePrior = priorGroupsList[0] ?? [];
    const { priorKeys, immediatePriorOcc } = buildImmediatePriorMaps(groups, immediatePrior);
    const priorCases = priors[0] ? priors[0].cases.map(toIntelCase) : [];
    const fdm = fileFailedDeltaMap(detail.cases.map(toIntelCase), priorCases);

    const scored = groups
      .map((g) => ({
        g,
        ...rerunScoreForGroup(g, priorKeys, immediatePriorOcc, fdm),
      }))
      .sort((a, b) => b.score - a.score);

    const runCases = [detail, ...priors].map((d) => d.cases.map(toIntelCase));
    const unstable = unstableFilesFromRuns(runCases, 8);

    const lines: string[] = [
      "SYSTEM TEST TRIAGE (server-generated)",
      `Run: ${latestSnap.id}`,
      `Created: ${latestSnap.createdAt}`,
      `Status: ${latestSnap.status} · Pass rate ${fmtPct(passRate(latestSnap))} · Failed ${latestSnap.failedCount}`,
      "",
      "RERUN PRIORITIES",
    ];
    for (let i = 0; i < Math.min(8, scored.length); i++) {
      const s = scored[i]!;
      lines.push(`${i + 1}) ${s.g.title} (${s.g.file}) score=${s.score}`);
      for (const r of s.reasons) lines.push(`   - ${r}`);
    }
    lines.push("", "UNSTABLE FILES");
    for (const u of unstable) {
      lines.push(`- ${u.file}: failed in ${u.failedRunsInWindow}/${u.windowSize} recent runs`);
    }

    const bodyText = lines.join("\n");
    const dedupeKey = `triage|${latestSnap.id}|${utcDayKey(new Date())}`;
    const envelope: AutomationJobPayloadEnvelope = {
      version: 1,
      delivery: this.buildDeliveryStub(
        "info",
        `Triage report — ${latestSnap.id.slice(0, 8)}…`,
        bodyText,
        dedupeKey,
        { runId: latestSnap.id },
      ),
      triage: { bodyText, runId: latestSnap.id, generatedAt: new Date().toISOString() },
    };

    const job = await this.jobs.createJob({
      type: "triage_generation",
      status: "generated",
      triggerSource: params.triggerSource,
      targetRunId: latestSnap.id,
      reportKind: "triage",
      headline: "Triage report",
      shortSummary: `Top score ${scored[0]?.score ?? 0}`,
      dedupeKey,
      payloadJson: envelope as unknown as Prisma.InputJsonValue,
      generatedAt: new Date(),
    });

    const send = await this.delivery.deliver(envelope);
    if (send.ok) {
      await this.jobs.updateJob(job.id, { status: "sent", sentAt: new Date() });
      return { jobId: job.id, status: "sent" as const, envelope };
    }
    await this.jobs.updateJob(job.id, {
      status: "failed",
      failureReason: send.error ?? "delivery_failed",
    });
    return { jobId: job.id, status: "failed" as const, envelope, error: send.error };
  }

  async sendJob(jobId: string) {
    const job = await this.jobs.getById(jobId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");
    const payload = job.payloadJson as unknown as AutomationJobPayloadEnvelope;
    if (!payload?.delivery) {
      throw new NotFoundException("JOB_PAYLOAD_INVALID");
    }
    const send = await this.delivery.deliver(payload);
    if (send.ok) {
      await this.jobs.updateJob(jobId, { status: "sent", sentAt: new Date(), failureReason: null });
      return { ok: true, status: "sent" as const };
    }
    await this.jobs.updateJob(jobId, {
      status: "failed",
      failureReason: send.error ?? "delivery_failed",
    });
    return { ok: false, status: "failed" as const, error: send.error };
  }

  private buildDeliveryStub(
    severity: SystemTestDeliveryPayload["severity"],
    title: string,
    bodyText: string,
    dedupeKey: string,
    structured: unknown,
  ): SystemTestDeliveryPayload {
    const channel: SystemTestDeliveryPayload["channel"] = this.webhookConfigured()
      ? "webhook"
      : "internal_log";
    return {
      channel,
      subject: title,
      title,
      bodyText,
      structuredSummary: structured as Record<string, unknown>,
      severity,
      dedupeKey,
    };
  }

  private buildEmptyDigestEnvelope(reason: string): AutomationJobPayloadEnvelope {
    const dedupeKey = `digest|empty|${utcDayKey(new Date())}`;
    return {
      version: 1,
      delivery: this.buildDeliveryStub("info", "Digest (empty)", reason, dedupeKey, { reason }),
    };
  }

  private buildMinimalRegressionEnvelope(
    title: string,
    body: string,
    dedupeKey: string,
  ): AutomationJobPayloadEnvelope {
    return {
      version: 1,
      delivery: this.buildDeliveryStub("info", title, body, dedupeKey, { title, body }),
    };
  }

  private formatDigestBodyText(d: DigestStructuredPayload): string {
    const lines = [
      `Latest run ${d.latestRunId} — ${d.latestStatus}`,
      `Pass rate ${d.passRatePct}, failed ${d.failedCount}, durationMs ${d.durationMs ?? "—"}`,
      `Δ vs prior: failed ${d.deltaVsPrevious.failedDelta}, pass rate Δ ${d.deltaVsPrevious.passRateDeltaPct} pts`,
      "",
      "Top changes:",
      ...d.topChanges.map((c) => `• ${c}`),
      "",
      "Top rerun priorities:",
      ...d.topRerunPriorities.map((r) => `• ${r.title} (${r.file}) score=${r.score}`),
      "",
      "Unstable files:",
      ...d.unstableFiles.map(
        (u) => `• ${u.file}: failed in ${u.failedRunsInWindow}/${u.windowSize} recent runs`,
      ),
      "",
      `Links: ${d.links.dashboard} · ${d.links.runDetail}`,
      d.links.compare ? `Compare: ${d.links.compare}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }
}

function summarizePayload(json: Prisma.JsonValue): { title: string; bodyExcerpt: string } {
  try {
    const o = json as unknown as AutomationJobPayloadEnvelope;
    const title = o.delivery?.title ?? "(no title)";
    const body = o.delivery?.bodyText ?? "";
    return {
      title,
      bodyExcerpt: body.length > 400 ? `${body.slice(0, 400)}…` : body,
    };
  } catch {
    return { title: "(unreadable)", bodyExcerpt: "" };
  }
}
