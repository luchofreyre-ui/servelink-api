import type { OperationalBookingSignal } from "../portfolio/portfolioOperationalSnapshot";
import type { DecisionConsistencyFinding, ConsistencyState } from "./decisionConsistencyModel";
import { findMatchingStandard } from "./adminDecisionStandardSelectors";

function deriveCurrentDecisionPath(signal: OperationalBookingSignal): string {
  const parts: string[] = [];
  if (signal.noAcceptance) parts.push("no acceptance");
  if (signal.offerExpired) parts.push("offer expired");
  if (signal.slaMiss) parts.push("SLA miss");
  if (signal.reassignment) parts.push("reassignment");
  if (signal.noShowRisk) parts.push("no-show risk");
  if (signal.overloadRisk) parts.push("overload risk");
  return parts.length > 0 ? `Dispatch / execution stress: ${parts.join(", ")}` : "No active dispatch exception flags";
}

export function evaluateDecisionConsistency(
  signal: OperationalBookingSignal,
): DecisionConsistencyFinding | null {
  const standard = findMatchingStandard(signal);
  if (!standard) return null;

  const currentDecisionPath = deriveCurrentDecisionPath(signal);

  let consistencyState: ConsistencyState = "aligned";
  let deviationReason = "Signals align with the recommended path.";
  let suggestedCorrection = "Maintain current posture; monitor on next sweep.";

  if (signal.noAcceptance || signal.slaMiss) {
    consistencyState = "missing_owner_action";
    deviationReason =
      "Dispatch path shows acceptance or timing failure — operator control should be explicit.";
    suggestedCorrection = standard.recommendedDecisionPath;
  } else if (signal.overloadRisk || signal.noShowRisk) {
    consistencyState = "under_responded";
    deviationReason = "Capacity or attendance risk suggests follow-through needs tightening before confirm.";
    suggestedCorrection = standard.recommendedDecisionPath;
  } else if (signal.offerExpired || signal.reassignment) {
    consistencyState = "under_responded";
    deviationReason = "Assignment loop churn — stale offers or handoff instability.";
    suggestedCorrection = standard.recommendedDecisionPath;
  } else {
    consistencyState = "aligned";
  }

  return {
    bookingId: signal.bookingId,
    standardId: standard.id,
    standardTitle: standard.title,
    currentDecisionPath,
    consistencyState,
    deviationReason,
    suggestedCorrection,
  };
}

export type FleetConsistencyModel = {
  queue: DecisionConsistencyFinding[];
};

export function evaluateFleetDecisionConsistency(
  signals: OperationalBookingSignal[],
): FleetConsistencyModel {
  const queue = signals
    .map((s) => evaluateDecisionConsistency(s))
    .filter((x): x is DecisionConsistencyFinding => Boolean(x));
  return { queue };
}
