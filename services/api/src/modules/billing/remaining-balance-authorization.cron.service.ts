import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { RemainingBalanceAuthorizationService } from "../bookings/payment-lifecycle/remaining-balance-authorization.service";
import { isCronDisabledByExplicitFalse } from "./payment-lifecycle-cron-env";
import type { CronHealthSnapshot } from "./payment-lifecycle-reconciliation.cron.service";

const EXPECTED_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class RemainingBalanceAuthorizationCronService {
  private readonly log = new Logger(RemainingBalanceAuthorizationCronService.name);
  private lastRunAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastFailureAt: Date | null = null;

  constructor(
    private readonly authz: RemainingBalanceAuthorizationService,
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

  @Cron("*/15 * * * *")
  async run(): Promise<void> {
    this.lastRunAt = new Date();
    const jobName = "remaining_balance_authorization";
    if (isCronDisabledByExplicitFalse(process.env.ENABLE_REMAINING_BALANCE_AUTH_CRON)) {
      this.log.log({
        kind: "remaining_balance_auth_cron",
        event: "disabled_by_env",
        env: "ENABLE_REMAINING_BALANCE_AUTH_CRON=false",
      });
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_REMAINING_BALANCE_AUTH_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "*/15 * * * *",
      envFlag: "ENABLE_REMAINING_BALANCE_AUTH_CRON",
    });
    try {
      const batch =
        Number(process.env.REMAINING_BALANCE_AUTH_CRON_BATCH ?? 25) || 25;
      const now = new Date();
      const ids = await this.authz.findBookingsNeedingAuthorizationWindow({
        now,
        limit: batch,
      });

      this.log.log({
        kind: "remaining_balance_auth_cron",
        event: "batch_start",
        batchSize: batch,
        candidateCount: ids.length,
        at: now.toISOString(),
      });

      if (!ids.length) {
        this.lastSuccessAt = new Date();
        this.log.log({
          kind: "remaining_balance_auth_cron",
          event: "batch_end",
          processed: 0,
          ok: 0,
          failedOrSkipped: 0,
        });
        await this.cronRunLedger?.recordSucceeded(ledgerId, {
          processed: 0,
          ok: 0,
          failedOrSkipped: 0,
        });
        return;
      }

      let ok = 0;
      let failedOrSkipped = 0;
      for (const id of ids) {
        try {
          const r = await this.authz.authorizeRemainingBalanceForBooking(id);
          if (r.ok) {
            ok += 1;
          } else {
            failedOrSkipped += 1;
            this.log.warn({
              kind: "remaining_balance_auth_cron",
              event: "booking_authorization_not_ok",
              bookingId: id,
              skipped: r.skipped ?? null,
              paymentIntentId: r.paymentIntentId ?? null,
            });
          }
        } catch (e) {
          failedOrSkipped += 1;
          this.lastFailureAt = new Date();
          this.log.error({
            kind: "remaining_balance_auth_cron",
            event: "booking_authorization_exception",
            bookingId: id,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      this.lastSuccessAt = new Date();
      this.log.log({
        kind: "remaining_balance_auth_cron",
        event: "batch_end",
        processed: ids.length,
        ok,
        failedOrSkipped,
      });
      await this.cronRunLedger?.recordSucceeded(ledgerId, {
        processed: ids.length,
        ok,
        failedOrSkipped,
      });
    } catch (e) {
      this.lastFailureAt = new Date();
      this.log.error({
        kind: "remaining_balance_auth_cron",
        event: "batch_failed",
        message: e instanceof Error ? e.message : String(e),
      });
      await this.cronRunLedger?.recordFailed(ledgerId, e);
      throw e;
    }
  }
}
