import type { PortfolioHistoryEvent, PortfolioHistoryRollup } from "./portfolioHistoryModel";
import type { OperationalBookingSignal } from "./portfolioOperationalSnapshot";

const MAX_EVENTS = 40;

function isFlagged(s: OperationalBookingSignal): boolean {
  return (
    s.noAcceptance ||
    s.offerExpired ||
    s.slaMiss ||
    s.reassignment ||
    s.noShowRisk ||
    s.overloadRisk
  );
}

/**
 * Governance memory from normalized operational signals (no external warehouse).
 */
export function buildPortfolioHistoryRollup(
  signals: OperationalBookingSignal[],
): PortfolioHistoryRollup {
  const events: PortfolioHistoryEvent[] = [];
  const ts = new Date().toISOString();

  const flagged = signals.filter(isFlagged);
  if (flagged.length > 0) {
    events.push({
      id: `mem-dispatch-${Date.now()}`,
      occurredAt: ts,
      category: "governance_watch",
      headline: "Dispatch / execution exception signals present",
      detail: `${flagged.length} in-view bookings carry at least one normalized dispatch flag.`,
    });
  }

  const sla = signals.filter((s) => s.slaMiss);
  if (sla.length > 0) {
    events.push({
      id: `mem-sla-${Date.now()}`,
      occurredAt: ts,
      category: "operations_health",
      headline: "Start SLA stress",
      detail: `${sla.length} bookings flagged with SLA miss in the operational contract.`,
    });
  }

  const noAccept = signals.filter((s) => s.noAcceptance);
  if (noAccept.length > 0) {
    events.push({
      id: `mem-accept-${Date.now()}`,
      occurredAt: ts,
      category: "decision_consistency",
      headline: "No-acceptance cluster",
      detail: `${noAccept.length} bookings show no FO acceptance in the signal contract.`,
    });
  }

  const truncated = events.length > MAX_EVENTS;
  return {
    events: events.slice(0, MAX_EVENTS),
    truncated,
  };
}

export function formatHistoryForAdminConsole(rollup: PortfolioHistoryRollup): string {
  return rollup.events.map((e) => `• ${e.headline}: ${e.detail}`).join("\n");
}
