import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
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
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  @Cron("0 13 * * *")
  async runDigestScheduled() {
    const jobName = "system_test_digest_scheduler";
    if (!this.automation.schedulerEnabled()) {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED",
      });
      return;
    }
    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "0 13 * * *",
      envFlag: "SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED",
    });
    try {
      await this.pipeline.enqueueScheduledDigest();
      await this.cronRunLedger?.recordSucceeded(ledgerId);
    } catch (e) {
      await this.cronRunLedger?.recordFailed(ledgerId, e);
      this.log.error(e instanceof Error ? e.stack : String(e));
    }
  }

  @Cron("0 */6 * * *")
  async runRegressionScheduled() {
    const jobName = "system_test_regression_scheduler";
    if (!this.automation.schedulerEnabled()) {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED",
      });
      return;
    }
    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "0 */6 * * *",
      envFlag: "SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED",
    });
    try {
      await this.pipeline.enqueueScheduledRegression();
      await this.cronRunLedger?.recordSucceeded(ledgerId);
    } catch (e) {
      await this.cronRunLedger?.recordFailed(ledgerId, e);
      this.log.error(e instanceof Error ? e.stack : String(e));
    }
  }
}
