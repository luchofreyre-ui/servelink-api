import { SYSTEM_TEST_INTELLIGENCE_VERSION } from "@servelink/system-test-intelligence";
import { forwardRef, Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";

import { computeRunSourceContentHash } from "../system-tests-intelligence/system-tests-intelligence-ingestion.service";
import { SystemTestsIntelligencePipelineService } from "../system-tests-intelligence/system-tests-intelligence.pipeline";
import { SystemTestsAutomationService } from "../system-tests-automation/system-tests-automation.service";
import { PrismaService } from "../../prisma";
import { SystemTestsPipelineJobsService } from "./system-tests-pipeline-jobs.service";
import type {
  EnqueueAnalysisOpts,
  EnqueueAutomationOpts,
  SystemTestPipelineAnalysisPayload,
  SystemTestPipelineAutomationPayload,
} from "./system-tests-pipeline.types";
import { toAutomationTriggerSource } from "./system-tests-pipeline.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  return Math.min(60_000, 2000 * 2 ** Math.max(0, attempt - 1));
}

export type EnqueuePipelineResult = {
  pipelineJobId: string;
  mode: "queued" | "inline" | "deduped";
};

@Injectable()
export class SystemTestsPipelineService {
  private readonly log = new Logger(SystemTestsPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: SystemTestsPipelineJobsService,
    private readonly intelligencePipeline: SystemTestsIntelligencePipelineService,
    @Inject(forwardRef(() => SystemTestsAutomationService))
    private readonly automation: SystemTestsAutomationService,
    @Optional()
    @InjectQueue("system-test-analysis")
    private readonly analysisQueue: Queue | null,
    @Optional()
    @InjectQueue("system-test-automation")
    private readonly automationQueue: Queue | null,
  ) {}

  analysisDedupeKey(
    runId: string,
    sourceContentHash: string,
    force: boolean,
  ): string | null {
    if (force) return null;
    return `analysis:${runId}:${SYSTEM_TEST_INTELLIGENCE_VERSION}:${sourceContentHash}`;
  }

  automationDedupeKey(opts: {
    runId: string | null | undefined;
    reason: string;
    evaluateRegression: boolean;
    generateDigest: boolean;
    generateTriage: boolean;
  }): string | null {
    const r = opts.runId ?? "global";
    return `automation:${r}:${opts.reason}:er:${opts.evaluateRegression ? 1 : 0}:gd:${opts.generateDigest ? 1 : 0}:gt:${opts.generateTriage ? 1 : 0}:${SYSTEM_TEST_INTELLIGENCE_VERSION}`;
  }

  async enqueueAnalysis(
    runId: string,
    opts: EnqueueAnalysisOpts,
  ): Promise<EnqueuePipelineResult> {
    const run = await this.prisma.systemTestRun.findUnique({
      where: { id: runId },
      include: { cases: { orderBy: { id: "asc" } } },
    });
    if (!run) {
      throw new Error(`SYSTEM_TEST_RUN_NOT_FOUND:${runId}`);
    }

    const hash = computeRunSourceContentHash(run, run.cases);
    const force = Boolean(opts.force);
    const dedupeKey = this.analysisDedupeKey(runId, hash, force);

    if (dedupeKey) {
      const active = await this.jobs.findActiveByDedupeKey("analysis", dedupeKey);
      if (active) {
        return { pipelineJobId: active.id, mode: "deduped" };
      }
    }

    const payload: SystemTestPipelineAnalysisPayload = {
      force,
      skipChildAutomation: Boolean(opts.skipChildAutomation),
    };

    const row = await this.jobs.createJob({
      runId,
      stage: "analysis",
      triggerSource: opts.triggerSource,
      dedupeKey,
      payloadJson: payload as object,
    });

    if (!this.analysisQueue) {
      await this.executeAnalysisJob(row.id);
      return { pipelineJobId: row.id, mode: "inline" };
    }

    const bullJob = await this.analysisQueue.add(
      "analyze",
      { pipelineJobId: row.id },
      {
        jobId: row.id,
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    );
    await this.jobs.markQueueJobId(row.id, bullJob.id ?? row.id);
    return { pipelineJobId: row.id, mode: "queued" };
  }

  async enqueueAutomation(
    opts: EnqueueAutomationOpts,
  ): Promise<EnqueuePipelineResult> {
    const evaluateRegression = Boolean(opts.evaluateRegression);
    const generateDigest = Boolean(opts.generateDigest);
    const generateTriage = Boolean(opts.generateTriage);
    if (!evaluateRegression && !generateDigest && !generateTriage) {
      throw new Error("PIPELINE_AUTOMATION_NOOP");
    }

    const reason = opts.reason;

    const dedupeKey =
      opts.triggerSource === "manual"
        ? null
        : this.automationDedupeKey({
            runId: opts.runId,
            reason,
            evaluateRegression,
            generateDigest,
            generateTriage,
          });

    if (dedupeKey) {
      const active = await this.jobs.findActiveByDedupeKey(
        "automation",
        dedupeKey,
      );
      if (active) {
        return { pipelineJobId: active.id, mode: "deduped" };
      }
    }

    const automationTriggerSource = toAutomationTriggerSource(
      opts.triggerSource,
    );

    const payload: SystemTestPipelineAutomationPayload = {
      reason,
      evaluateRegression,
      generateDigest,
      generateTriage,
      automationTriggerSource,
    };

    const row = await this.jobs.createJob({
      runId: opts.runId ?? null,
      stage: "automation",
      triggerSource: opts.triggerSource,
      dedupeKey,
      payloadJson: payload as object,
      parentJobId: opts.parentJobId ?? null,
    });

    if (!this.automationQueue) {
      await this.executeAutomationJob(row.id);
      return { pipelineJobId: row.id, mode: "inline" };
    }

    const bullJob = await this.automationQueue.add(
      "automate",
      { pipelineJobId: row.id },
      {
        jobId: row.id,
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    );
    await this.jobs.markQueueJobId(row.id, bullJob.id ?? row.id);
    return { pipelineJobId: row.id, mode: "queued" };
  }

  /** Cron: regression evaluation */
  async enqueueScheduledRegression(): Promise<EnqueuePipelineResult> {
    return this.enqueueAutomation({
      runId: null,
      reason: "scheduled",
      evaluateRegression: true,
      generateDigest: false,
      generateTriage: false,
      triggerSource: "schedule",
    });
  }

  /** Cron: digest */
  async enqueueScheduledDigest(): Promise<EnqueuePipelineResult> {
    return this.enqueueAutomation({
      runId: null,
      reason: "scheduled",
      evaluateRegression: false,
      generateDigest: true,
      generateTriage: false,
      triggerSource: "schedule",
    });
  }

  /** Admin manual digest (automation jobs recorded as manual). */
  async enqueueManualDigest(): Promise<EnqueuePipelineResult> {
    return this.enqueueAutomation({
      runId: null,
      reason: "manual",
      evaluateRegression: false,
      generateDigest: true,
      generateTriage: false,
      triggerSource: "manual",
    });
  }

  async executeAnalysisJob(pipelineJobId: string): Promise<void> {
    const row = await this.jobs.getById(pipelineJobId);
    if (!row || row.stage !== "analysis") {
      this.log.warn(`executeAnalysisJob: missing or wrong stage ${pipelineJobId}`);
      return;
    }

    const payload = row.payloadJson as SystemTestPipelineAnalysisPayload;
    const runId = row.runId;
    if (!runId) {
      await this.jobs.markDead(pipelineJobId, "missing runId");
      return;
    }

    const max = Math.max(1, row.maxAttempts);
    let lastErr = "";

    for (let attempt = 1; attempt <= max; attempt += 1) {
      await this.jobs.markRunning(pipelineJobId, attempt);
      try {
        const outcome = await this.intelligencePipeline.analyzeRun(runId, {
          force: payload.force,
        });

        if (outcome === "failed") {
          throw new Error("ANALYSIS_RETURNED_FAILED");
        }

        await this.jobs.markCompleted(pipelineJobId);

        const shouldChain =
          !payload.skipChildAutomation &&
          (outcome === "created" || outcome === "updated");

        if (shouldChain) {
          try {
            await this.enqueueAutomation({
              runId,
              reason: "analysis_completed",
              evaluateRegression: true,
              generateDigest: false,
              generateTriage: false,
              triggerSource: row.triggerSource,
              parentJobId: pipelineJobId,
            });
          } catch (e) {
            this.log.warn(
              `enqueue automation after analysis failed: ${String(e)}`,
            );
          }
        }

        return;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        if (attempt < max) {
          await this.jobs.markRetrying(pipelineJobId, lastErr, attempt);
          await sleep(backoffMs(attempt));
        } else {
          await this.jobs.markDead(pipelineJobId, lastErr);
        }
      }
    }
  }

  async executeAutomationJob(pipelineJobId: string): Promise<void> {
    const row = await this.jobs.getById(pipelineJobId);
    if (!row || row.stage !== "automation") {
      this.log.warn(
        `executeAutomationJob: missing or wrong stage ${pipelineJobId}`,
      );
      return;
    }

    const payload = row.payloadJson as SystemTestPipelineAutomationPayload;
    const max = Math.max(1, row.maxAttempts);
    let lastErr = "";

    for (let attempt = 1; attempt <= max; attempt += 1) {
      await this.jobs.markRunning(pipelineJobId, attempt);
      try {
        if (payload.evaluateRegression) {
          if (
            payload.reason === "analysis_completed" &&
            row.runId
          ) {
            await this.automation.onRunIntelligenceReady(row.runId);
          } else {
            await this.automation.evaluateRegressionAlert({
              triggerSource: payload.automationTriggerSource,
            });
          }
        }
        if (payload.generateDigest) {
          await this.automation.runDigest({
            triggerSource: payload.automationTriggerSource,
          });
        }
        if (payload.generateTriage) {
          await this.automation.generateTriage({
            triggerSource: payload.automationTriggerSource,
          });
        }

        await this.jobs.markCompleted(pipelineJobId);
        return;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        if (attempt < max) {
          await this.jobs.markRetrying(pipelineJobId, lastErr, attempt);
          await sleep(backoffMs(attempt));
        } else {
          await this.jobs.markDead(pipelineJobId, lastErr);
        }
      }
    }
  }

  async retryPipelineJob(pipelineJobId: string): Promise<EnqueuePipelineResult> {
    const row = await this.jobs.getById(pipelineJobId);
    if (!row) {
      throw new Error("PIPELINE_JOB_NOT_FOUND");
    }
    if (row.status !== "failed" && row.status !== "dead") {
      throw new Error("PIPELINE_JOB_NOT_RETRYABLE");
    }

    await this.jobs.resetToQueuedForRetry(pipelineJobId);

    if (row.stage === "analysis") {
      if (!this.analysisQueue) {
        await this.executeAnalysisJob(pipelineJobId);
        return { pipelineJobId, mode: "inline" };
      }
      const bullJob = await this.analysisQueue.add(
        "analyze",
        { pipelineJobId },
        {
          jobId: `${pipelineJobId}:retry:${Date.now()}`,
          attempts: 1,
          removeOnComplete: 1000,
          removeOnFail: 500,
        },
      );
      await this.jobs.markQueueJobId(pipelineJobId, bullJob.id ?? pipelineJobId);
      return { pipelineJobId, mode: "queued" };
    }

    if (!this.automationQueue) {
      await this.executeAutomationJob(pipelineJobId);
      return { pipelineJobId, mode: "inline" };
    }
    const bullJob = await this.automationQueue.add(
      "automate",
      { pipelineJobId },
      {
        jobId: `${pipelineJobId}:retry:${Date.now()}`,
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    );
    await this.jobs.markQueueJobId(pipelineJobId, bullJob.id ?? pipelineJobId);
    return { pipelineJobId, mode: "queued" };
  }
}
