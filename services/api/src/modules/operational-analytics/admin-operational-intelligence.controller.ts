import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { OperationalAnalyticsAggregationService } from "./operational-analytics-aggregation.service";
import { OperationalIntelligenceQueryService } from "./operational-intelligence-query.service";
import { OperationalReplayIntelligenceSuiteService } from "./operational-replay-intelligence-suite.service";
import { ANALYTICS_AGGREGATE_WINDOW } from "./operational-analytics.constants";

type RefreshBody = { aggregateWindow?: string };

type ReplayCompareBody = {
  aggregateWindow?: string;
  olderReplaySessionId?: string;
  newerReplaySessionId?: string;
};

/** Admin operational intelligence — read surfaces plus explicit analytics warehouse refresh (no automation). */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/operational-intelligence")
export class AdminOperationalIntelligenceController {
  constructor(
    private readonly intelligence: OperationalIntelligenceQueryService,
    private readonly aggregation: OperationalAnalyticsAggregationService,
    private readonly replaySuite: OperationalReplayIntelligenceSuiteService,
  ) {}

  @Get("dashboard")
  async dashboard() {
    const dashboard =
      await this.intelligence.getAdminOperationalIntelligenceDashboard();
    return { ok: true, dashboard };
  }

  /** Recomputes and replaces analytics snapshots for the requested window — invoked explicitly only. */
  @Post("refresh-snapshots")
  async refreshSnapshots(@Body() body: RefreshBody) {
    const windowKey =
      body?.aggregateWindow?.trim() || ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;
    const result =
      await this.aggregation.refreshPlatformOperationalSnapshots({
        aggregateWindow: windowKey,
      });
    return { ok: true, aggregateWindow: windowKey, ...result };
  }

  /**
   * Persist a deterministic replay comparison for an arbitrary admin-selected session pair (same aggregate window).
   * Does not refresh archives, mutate bookings, or dispatch interventions.
   */
  @Post("replay-compare")
  async replayCompare(@Body() body: ReplayCompareBody) {
    const windowKey =
      body?.aggregateWindow?.trim() || ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;
    const comparison =
      await this.replaySuite.persistExplicitReplayComparison({
        aggregateWindow: windowKey,
        olderReplaySessionId: body?.olderReplaySessionId ?? "",
        newerReplaySessionId: body?.newerReplaySessionId ?? "",
      });
    return { ok: true, aggregateWindow: windowKey, ...comparison };
  }
}
