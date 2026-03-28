import { Injectable } from "@nestjs/common";

import type { SystemTestPersistedIntelligenceDto } from "../system-tests/dto/system-test-run-detail.dto";
import { SystemTestsIntelligenceIngestionService } from "./system-tests-intelligence-ingestion.service";
import { SystemTestsIntelligenceReadService } from "./system-tests-intelligence-read.service";
import type { FailureGroup } from "@servelink/system-test-intelligence";
import type { PersistedRunIntelligenceRead } from "./system-tests-intelligence.types";

@Injectable()
export class SystemTestsIntelligenceService {
  constructor(
    private readonly ingestion: SystemTestsIntelligenceIngestionService,
    private readonly read: SystemTestsIntelligenceReadService,
  ) {}

  ingestRun(runId: string) {
    return this.ingestion.ingestRun(runId);
  }

  ingestRunSafe(runId: string) {
    return this.ingestion.ingestRunSafe(runId);
  }

  /** Internal / scripts; includes sourceContentHash. */
  getPersistedForRun(
    runId: string,
  ): Promise<PersistedRunIntelligenceRead | null> {
    return this.read.getPersistedForRun(runId);
  }

  /** Admin API + UI. */
  getPersistedIntelligenceApiDto(
    runId: string,
  ): Promise<SystemTestPersistedIntelligenceDto | null> {
    return this.read.getPersistedIntelligenceApiDto(runId);
  }

  /** Automation: persisted groups or caller fallback from cases. */
  getFailureGroupsForRun(runId: string): Promise<FailureGroup[] | null> {
    return this.read.getFailureGroupsForRun(runId);
  }
}
