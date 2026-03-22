import type { FleetRollup } from "./portfolioOperationalSnapshot";
import type { PortfolioHealthModel } from "./portfolioHealthModel";
import { buildPortfolioHealthModel } from "./portfolioHealthSelectors";
import type { PortfolioOperationalSnapshot } from "./portfolioOperationalSelectors";

export type PortfolioHealthStoreState = {
  lastSnapshot: PortfolioOperationalSnapshot | null;
  /** Prior fleet rollup for trend deltas (per-browser / per-session; not multi-tenant durable). */
  priorFleetRollup: FleetRollup | null;
};

/**
 * Lightweight store for client surfaces that want to keep a prior rollup between refreshes.
 */
export function createPortfolioHealthStore(): {
  getState: () => PortfolioHealthStoreState;
  ingestSnapshot: (snap: PortfolioOperationalSnapshot) => PortfolioHealthModel;
  reset: () => void;
} {
  let lastSnapshot: PortfolioOperationalSnapshot | null = null;
  let priorFleetRollup: FleetRollup | null = null;

  return {
    getState: () => ({ lastSnapshot, priorFleetRollup }),
    ingestSnapshot(snap: PortfolioOperationalSnapshot) {
      const health = buildPortfolioHealthModel(snap.bookingSignals, priorFleetRollup);
      priorFleetRollup = snap.fleetRollup;
      lastSnapshot = snap;
      return health;
    },
    reset() {
      lastSnapshot = null;
      priorFleetRollup = null;
    },
  };
}
