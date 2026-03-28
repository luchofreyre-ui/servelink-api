import { Injectable } from "@nestjs/common";

import { SystemTestsIntelligenceIngestionService } from "./system-tests-intelligence-ingestion.service";

export type AnalyzeRunOutcome = "created" | "updated" | "skipped" | "failed";

/**
 * Canonical analysis persistence only. Phase 7A: automation is queued via
 * SystemTestsPipelineService after analysis completes in the worker.
 */
@Injectable()
export class SystemTestsIntelligencePipelineService {
  constructor(private readonly ingestion: SystemTestsIntelligenceIngestionService) {}

  /**
   * Canonical analysis + persistence (no inline automation).
   */
  async analyzeRun(
    runId: string,
    opts?: { force?: boolean },
  ): Promise<AnalyzeRunOutcome> {
    return this.ingestion.ingestRun(runId, {
      force: opts?.force,
    });
  }
}
