import type { PublicBookingDepositPrepareResponse } from "./bookingPaymentClient";
import { isDepositFullySatisfied } from "./bookingPaymentClient";

/** Total wall-clock budget for post-Stripe deposit status polling on the review step. */
export const DEPOSIT_PREPARE_POLL_MAX_MS = 15_000;

/** Gap after poll attempt `attemptIndex` (0 = first gap after the initial attempt). */
export function depositPreparePollBackoffMs(attemptIndex: number): number {
  const seq = [500, 1000, 1500, 2500, 4000];
  return attemptIndex < seq.length ? seq[attemptIndex]! : 4000;
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise<void>((r) => setTimeout(r, ms));
}

export type DepositPreparePollOutcome = "satisfied" | "timeout" | "failed";

export type DepositPreparePollClock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

const defaultClock: DepositPreparePollClock = {
  now: () => Date.now(),
  sleep: sleepMs,
};

/**
 * Polls deposit-prepare until satisfied, failure (non-deposit mode), or the 15s window elapses.
 * Injected `fetchPrepare` keeps this unit-testable without network.
 */
export async function pollDepositPrepareUntilSatisfiedOrCap(
  bookingId: string,
  fetchPrepare: (id: string) => Promise<PublicBookingDepositPrepareResponse>,
  clock: DepositPreparePollClock = defaultClock,
): Promise<DepositPreparePollOutcome> {
  const deadline = clock.now() + DEPOSIT_PREPARE_POLL_MAX_MS;
  let gapIndex = 0;

  while (clock.now() < deadline) {
    const prep = await fetchPrepare(bookingId);
    if (isDepositFullySatisfied(prep)) return "satisfied";
    if (prep.paymentMode !== "deposit") return "failed";

    const delay = depositPreparePollBackoffMs(gapIndex);
    gapIndex += 1;
    if (clock.now() + delay >= deadline) return "timeout";
    await clock.sleep(delay);
  }
  return "timeout";
}
