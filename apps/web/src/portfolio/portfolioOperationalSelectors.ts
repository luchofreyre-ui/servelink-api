import type { FleetRollup } from "./portfolioOperationalSnapshot";
import {
  buildFleetRollup,
  extractOperationalSignalsFromScreen,
} from "./portfolioOperationalSnapshot";
import { buildPortfolioHealthModel } from "./portfolioHealthSelectors";
import { buildFoCohortModel } from "./foCohortSelectors";
import { evaluateFleetDecisionConsistency } from "@/standards/decisionConsistencySelectors";
import { buildPortfolioHistoryRollup } from "./portfolioHistorySelectors";

export interface PortfolioOperationalSnapshot {
  bookingSignals: NonNullable<ReturnType<typeof extractOperationalSignalsFromScreen>>[];
  fleetRollup: ReturnType<typeof buildFleetRollup>;
  healthModel: ReturnType<typeof buildPortfolioHealthModel>;
  cohortModel: ReturnType<typeof buildFoCohortModel>;
  consistencyModel: ReturnType<typeof evaluateFleetDecisionConsistency>;
  historyRollup: ReturnType<typeof buildPortfolioHistoryRollup>;
  managementPosture: "stable" | "watch" | "tighten";
  meta: {
    source: "admin_console" | "admin_booking_detail" | "fo_console" | "customer_console" | "unknown";
    bookingCount: number;
  };
}

export function buildPortfolioOperationalSnapshot(
  input: {
    bookingScreens: unknown[];
    source?:
      | "admin_console"
      | "admin_booking_detail"
      | "fo_console"
      | "customer_console"
      | "unknown";
  },
  priorFleetRollup?: FleetRollup | null,
): PortfolioOperationalSnapshot {
  const bookingSignals = input.bookingScreens
    .map(extractOperationalSignalsFromScreen)
    .filter(
      (value): value is NonNullable<ReturnType<typeof extractOperationalSignalsFromScreen>> =>
        Boolean(value),
    );

  const fleetRollup = buildFleetRollup(bookingSignals);
  const healthModel = buildPortfolioHealthModel(bookingSignals, priorFleetRollup ?? null);
  const cohortModel = buildFoCohortModel(bookingSignals);
  const consistencyModel = evaluateFleetDecisionConsistency(bookingSignals);
  const historyRollup = buildPortfolioHistoryRollup(bookingSignals);

  let managementPosture: PortfolioOperationalSnapshot["managementPosture"] = "stable";
  if (fleetRollup.flaggedBookings > 0 || consistencyModel.queue.length > 0) {
    managementPosture = "watch";
  }
  if (fleetRollup.slaMissCount > 0 || fleetRollup.noAcceptanceCount > 0) {
    managementPosture = "tighten";
  }

  return {
    bookingSignals,
    fleetRollup,
    healthModel,
    cohortModel,
    consistencyModel,
    historyRollup,
    managementPosture,
    meta: {
      source: input.source ?? "unknown",
      bookingCount: input.bookingScreens.length,
    },
  };
}
