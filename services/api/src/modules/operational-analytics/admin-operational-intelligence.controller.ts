import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { OperationalIntelligenceQueryService } from "./operational-intelligence-query.service";
import { OperationalReplayIntelligenceSuiteService } from "./operational-replay-intelligence-suite.service";
import { OperationalAnalyticsRefreshRunService } from "./operational-analytics-refresh-run.service";
import { ANALYTICS_AGGREGATE_WINDOW } from "./operational-analytics.constants";

type RefreshBody = { aggregateWindow?: string };

type AuthedRequest = {
  user?: { userId: string; role: string; email?: string };
};

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
    private readonly replaySuite: OperationalReplayIntelligenceSuiteService,
    private readonly refreshRuns: OperationalAnalyticsRefreshRunService,
  ) {}

  @Get("dashboard")
  async dashboard() {
    const dashboard =
      await this.intelligence.getAdminOperationalIntelligenceDashboard();
    return { ok: true, dashboard };
  }

  /** Recomputes and replaces analytics snapshots for the requested window — invoked explicitly only. */
  @Post("refresh-snapshots")
  async refreshSnapshots(@Body() body: RefreshBody, @Req() req: AuthedRequest) {
    const windowKey =
      body?.aggregateWindow?.trim() || ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;
    const outcome = await this.refreshRuns.executeManualWarehouseRefresh({
      aggregateWindow: windowKey,
      requestedByUserId: req.user?.userId ?? null,
      requestedByEmail:
        typeof req.user?.email === "string" ? req.user.email : null,
    });
    if (!outcome.ok && outcome.status === "blocked") {
      throw new HttpException(outcome, HttpStatus.CONFLICT);
    }
    if (!outcome.ok) {
      throw new HttpException(outcome, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return outcome;
  }

  /** Latest durable warehouse refresh audit runs (newest first). */
  @Get("refresh-runs")
  async refreshRunsQuery(@Query("limit") limitRaw?: string) {
    let limit = Number(limitRaw ?? 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;
    const payload =
      await this.refreshRuns.listRefreshRunsWithReplayClassification({
        limit,
      });
    return {
      ok: true,
      items: payload.items,
      activeRun: payload.activeRun,
      staleReconciledCount: payload.staleReconciledCount,
      latestReplayClassification: payload.latestReplayClassification,
    };
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
