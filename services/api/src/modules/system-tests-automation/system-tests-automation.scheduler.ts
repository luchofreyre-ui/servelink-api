import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { SystemTestsPipelineService } from "../system-tests-pipeline/system-tests-pipeline.service";
import { SystemTestsAutomationService } from "./system-tests-automation.service";

/**
 * Cron hooks are **opt-in** via SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED=1.
 * Digest: daily 13:00 UTC. Regression: every 6 hours on the hour.
 */
@Injectable()
export class SystemTestsAutomationScheduler {
  private readonly log = new Logger(SystemTestsAutomationScheduler.name);

  constructor(
    private readonly automation: SystemTestsAutomationService,
    private readonly pipeline: SystemTestsPipelineService,
  ) {}

  @Cron("0 13 * * *")
  async runDigestScheduled() {
    if (!this.automation.schedulerEnabled()) return;
    try {
      await this.pipeline.enqueueScheduledDigest();
    } catch (e) {
      this.log.error(e instanceof Error ? e.stack : String(e));
    }
  }

  @Cron("0 */6 * * *")
  async runRegressionScheduled() {
    if (!this.automation.schedulerEnabled()) return;
    try {
      await this.pipeline.enqueueScheduledRegression();
    } catch (e) {
      this.log.error(e instanceof Error ? e.stack : String(e));
    }
  }
}
