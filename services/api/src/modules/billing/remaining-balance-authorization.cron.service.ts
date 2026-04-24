import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RemainingBalanceAuthorizationService } from "../bookings/payment-lifecycle/remaining-balance-authorization.service";
import { isCronDisabledByExplicitFalse } from "./payment-lifecycle-cron-env";

@Injectable()
export class RemainingBalanceAuthorizationCronService {
  private readonly log = new Logger(RemainingBalanceAuthorizationCronService.name);

  constructor(private readonly authz: RemainingBalanceAuthorizationService) {}

  @Cron("*/15 * * * *")
  async run(): Promise<void> {
    if (isCronDisabledByExplicitFalse(process.env.ENABLE_REMAINING_BALANCE_AUTH_CRON)) {
      this.log.log({
        kind: "remaining_balance_auth_cron",
        event: "disabled_by_env",
        env: "ENABLE_REMAINING_BALANCE_AUTH_CRON=false",
      });
      return;
    }

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
      this.log.log({
        kind: "remaining_balance_auth_cron",
        event: "batch_end",
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
        this.log.error({
          kind: "remaining_balance_auth_cron",
          event: "booking_authorization_exception",
          bookingId: id,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    this.log.log({
      kind: "remaining_balance_auth_cron",
      event: "batch_end",
      processed: ids.length,
      ok,
      failedOrSkipped,
    });
  }
}
