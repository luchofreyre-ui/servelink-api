import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import type { CronHealthSnapshot } from "../billing/payment-lifecycle-reconciliation.cron.service";
import { OperationalAnalyticsAggregationService } from "./operational-analytics-aggregation.service";
import {
  ANALYTICS_AGGREGATE_WINDOW,
  OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME,
} from "./operational-analytics.constants";

const SCHEDULE = "*/30 * * * *";
const EXPECTED_INTERVAL_MS = 30 * 60 * 1000;

@Injectable()
export class OperationalAnalyticsWarehouseRefreshCronService {
  private readonly log = new Logger(OperationalAnalyticsWarehouseRefreshCronService.name);
  private lastRunAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastFailureAt: Date | null = null;

  constructor(
    private readonly aggregation: OperationalAnalyticsAggregationService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  getHealthSnapshot(now = new Date()): CronHealthSnapshot {
    return {
      lastRunAt: this.lastRunAt?.toISOString() ?? null,
      lastSuccessAt: this.lastSuccessAt?.toISOString() ?? null,
      lastFailureAt: this.lastFailureAt?.toISOString() ?? null,
      stale:
        this.lastRunAt === null ||
        now.getTime() - this.lastRunAt.getTime() > EXPECTED_INTERVAL_MS * 2,
    };
  }

  @Cron(SCHEDULE)
  async tick(): Promise<void> {
    const jobName = OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME;
    this.lastRunAt = new Date();

    if (process.env.ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON !== "true") {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: SCHEDULE,
      envFlag: "ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON",
      aggregateWindow: ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW,
    });

    try {
      const result = await this.aggregation.refreshPlatformOperationalSnapshots();
      this.lastSuccessAt = new Date();
      await this.cronRunLedger?.recordSucceeded(ledgerId, {
        aggregateWindow: ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW,
        snapshotsWritten: result.snapshotsWritten,
        aggregatesWritten: result.aggregatesWritten,
        operationalReplaySessionsWritten: result.operationalReplaySessionsWritten,
        operationalReplayDiffsWritten: result.operationalReplayDiffsWritten,
        operationalEntityNodesWritten: result.operationalEntityNodesWritten,
        operationalEntityEdgesWritten: result.operationalEntityEdgesWritten,
        cohortSnapshotsWritten: result.cohortSnapshotsWritten,
        operationalExperimentSnapshotsWritten:
          result.operationalExperimentSnapshotsWritten,
        interventionSandboxesWritten: result.interventionSandboxesWritten,
        interventionAssignmentsWritten: result.interventionAssignmentsWritten,
        validityCertificationsWritten: result.validityCertificationsWritten,
      });
    } catch (e: unknown) {
      this.lastFailureAt = new Date();
      await this.cronRunLedger?.recordFailed(ledgerId, e, {
        aggregateWindow: ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW,
      });
      this.log.error(e instanceof Error ? e.stack : String(e));
    }
  }
}
