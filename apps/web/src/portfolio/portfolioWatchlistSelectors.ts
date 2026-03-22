import type { PortfolioOperationalSnapshot } from "./portfolioOperationalSelectors";

export type WatchlistCategory =
  | "standards_drift"
  | "missing_owner_action"
  | "follow_up_discipline"
  | "review_discipline"
  | "overload_economics_proof";

export type WatchlistBucket = {
  category: WatchlistCategory;
  title: string;
  bookingIds: string[];
  managementCue: string;
};

function uniq(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

/**
 * Governance-informed watchlists for admin surfaces (internal only).
 */
export function buildAdminWatchlistBuckets(
  snapshot: PortfolioOperationalSnapshot,
): WatchlistBucket[] {
  const findings = snapshot.consistencyModel.queue;
  return [
    {
      category: "standards_drift",
      title: "Standards drift",
      bookingIds: uniq(
        findings
          .filter(
            (c) =>
              c.consistencyState !== "aligned" && c.consistencyState !== "acceptable_variant",
          )
          .map((c) => c.bookingId),
      ),
      managementCue: "Compare live posture to decision standards; assign corrective owners.",
    },
    {
      category: "missing_owner_action",
      title: "Missing owner action",
      bookingIds: uniq(
        findings
          .filter((c) => c.consistencyState === "missing_owner_action")
          .map((c) => c.bookingId),
      ),
      managementCue: "Name an owner before the next dispatch or customer touch.",
    },
    {
      category: "follow_up_discipline",
      title: "Follow-up discipline",
      bookingIds: uniq(
        snapshot.bookingSignals
          .filter((s) => s.reassignment || s.noShowRisk)
          .map((s) => s.bookingId),
      ),
      managementCue: "Close the loop on handoffs and crew readiness.",
    },
    {
      category: "review_discipline",
      title: "Review discipline",
      bookingIds: uniq(
        snapshot.bookingSignals
          .filter((s) => s.slaMiss || s.offerExpired)
          .map((s) => s.bookingId),
      ),
      managementCue: "Resolve timing and offer-expiry loops before the next dispatch wave.",
    },
    {
      category: "overload_economics_proof",
      title: "Overload + acceptance stress",
      bookingIds: uniq(
        snapshot.bookingSignals
          .filter((s) => s.overloadRisk && (s.noAcceptance || s.noShowRisk))
          .map((s) => s.bookingId),
      ),
      managementCue: "Reduce intake or recover reliability before adding load.",
    },
  ];
}
