import {
  AdminBookingDispatchCandidate,
  AdminBookingDispatchDetailModel,
  AdminBookingDispatchEconomics,
  AdminBookingDispatchGovernance,
  AdminBookingDispatchTimelineEvent,
  AdminDispatchAction,
} from "./adminBookingDispatchDetailModel";
import type { BuildSnapshotInput } from "@/portfolio/portfolioOperationalSnapshot";
import type { OperationalBookingSignal } from "@/portfolio/portfolioOperationalSnapshot";
import { buildPortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import { findMatchingStandard } from "@/standards/adminDecisionStandardSelectors";
import { normalizeBookingBillingModel, normalizeBookingScreen } from "@/contracts/contractNormalization";
import type { BookingScreen } from "@/contracts/bookingScreen";
import type { DispatchCandidate } from "@/contracts/dispatchCandidate";

function formatDateTime(value?: string): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function titleize(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildSignalFlagsFromPortfolioSignal(signal: OperationalBookingSignal | undefined): string[] {
  const flags: string[] = [];
  if (!signal) return flags;

  if (signal.noAcceptance) flags.push("No acceptance");
  if (signal.offerExpired) flags.push("Offer expired");
  if (signal.slaMiss) flags.push("SLA miss");
  if (signal.reassignment) flags.push("Reassignment");
  if (signal.noShowRisk) flags.push("No-show risk");
  if (signal.overloadRisk) flags.push("Overload risk");

  return flags;
}

function inferConsistencyState(
  signal: OperationalBookingSignal | undefined,
  candidateCount: number,
): AdminBookingDispatchGovernance["consistencyState"] {
  if (!signal) return "watch";
  if (signal.slaMiss || signal.noAcceptance) return "drift";
  if (signal.reassignment || signal.noShowRisk || candidateCount === 0) {
    return "watch";
  }
  return "aligned";
}

function buildConsistencyReasons(
  signal: OperationalBookingSignal | undefined,
  candidateCount: number,
): string[] {
  const reasons: string[] = [];

  if (!signal) {
    reasons.push(
      "No portfolio signal was found for this booking, so governance should verify ownership and follow-through.",
    );
    return reasons;
  }

  if (signal.noAcceptance) {
    reasons.push(
      "No acceptance suggests the assignment path did not convert cleanly and may need direct operator intervention.",
    );
  }
  if (signal.offerExpired) {
    reasons.push(
      "Offer expiry indicates the dispatch loop waited too long or the candidate sequence was weak.",
    );
  }
  if (signal.slaMiss) {
    reasons.push(
      "SLA miss means the current dispatch outcome already failed execution timing and needs stronger control.",
    );
  }
  if (signal.reassignment) {
    reasons.push(
      "Reassignment pressure suggests ownership instability or low confidence in the current path.",
    );
  }
  if (signal.noShowRisk) {
    reasons.push(
      "No-show risk means proof and reliability should matter more than simple availability.",
    );
  }
  if (signal.overloadRisk) {
    reasons.push("Overload risk means local capacity may be distorting assignment quality.");
  }
  if (candidateCount === 0) {
    reasons.push(
      "No ranked candidates are available, which means the operator is making a decision without a healthy dispatch market.",
    );
  }

  if (reasons.length === 0) {
    reasons.push("Signal posture is stable and appears aligned with a normal dispatch path.");
  }

  return reasons;
}

function buildGovernance(
  signal: OperationalBookingSignal | undefined,
  candidates: AdminBookingDispatchCandidate[],
): AdminBookingDispatchGovernance {
  const standard = signal ? findMatchingStandard(signal) : null;
  const consistencyState = inferConsistencyState(signal, candidates.length);
  const consistencyReasons = buildConsistencyReasons(signal, candidates.length);
  const riskFlags = buildSignalFlagsFromPortfolioSignal(signal);

  let consistencyHeadline = "Decision appears aligned with the current dispatch posture.";
  if (consistencyState === "watch") {
    consistencyHeadline =
      "This booking needs operator attention before approval because execution risk is rising.";
  }
  if (consistencyState === "drift") {
    consistencyHeadline =
      "This booking is drifting from standard operating posture and should not be passed through casually.";
  }

  let nextBestAction =
    "Approve the top candidate if proof, economics, and reliability all agree.";
  let ownerRecommendation =
    "Dispatch admin should confirm the decision path and ownership before closing the loop.";

  if (riskFlags.includes("SLA miss")) {
    nextBestAction = "Reassign or escalate immediately; timing failure has already happened.";
    ownerRecommendation =
      "Admin should take direct control instead of waiting on passive follow-up.";
  } else if (riskFlags.includes("No acceptance")) {
    nextBestAction =
      "Review candidate order, economics, and outreach strategy before re-offering.";
  } else if (riskFlags.includes("Overload risk")) {
    nextBestAction =
      "Prefer a stable but slightly lower-scored operator over an overloaded one.";
  } else if (riskFlags.includes("No-show risk")) {
    nextBestAction =
      "Weight proof and reliability above simple rank before confirming assignment.";
  }

  return {
    standardTitle: standard?.title,
    scenarioSignature: standard?.scenarioSignature,
    recommendedDecisionPath: standard?.recommendedDecisionPath,
    consistencyState,
    consistencyHeadline,
    consistencyReasons,
    riskFlags,
    nextBestAction,
    ownerRecommendation,
  };
}

function buildEconomics(screen: BookingScreen | undefined): AdminBookingDispatchEconomics {
  const billing = normalizeBookingBillingModel(screen?.billing);

  const customerTotal = billing?.customerTotal;
  const franchiseOwnerPayout = billing?.franchiseOwnerPayout;
  const cleanerPayout = billing?.cleanerPayout;
  const platformRevenue = billing?.platformRevenue;
  const marginPercent = billing?.marginPercent;

  let economicsBand: AdminBookingDispatchEconomics["economicsBand"] = "unknown";
  if (marginPercent !== undefined) {
    if (marginPercent >= 22) economicsBand = "strong";
    else if (marginPercent >= 12) economicsBand = "acceptable";
    else economicsBand = "thin";
  }

  let headline =
    "Economics unavailable — operator should verify before taking an override path.";
  if (economicsBand === "strong") {
    headline =
      "Economics are healthy enough to prioritize reliability and execution confidence.";
  }
  if (economicsBand === "acceptable") {
    headline =
      "Economics are workable, but unnecessary override churn should be avoided.";
  }
  if (economicsBand === "thin") {
    headline =
      "Economics are thin, so operator decisions should avoid extra touches or fragile assignments.";
  }

  const notes: string[] = [];
  if (customerTotal !== undefined) notes.push(`Customer total: ${customerTotal}`);
  if (franchiseOwnerPayout !== undefined) notes.push(`FO payout: ${franchiseOwnerPayout}`);
  if (cleanerPayout !== undefined) notes.push(`Cleaner payout: ${cleanerPayout}`);
  if (platformRevenue !== undefined) notes.push(`Platform revenue: ${platformRevenue}`);
  if (marginPercent !== undefined) notes.push(`Margin: ${Math.round(marginPercent)}%`);

  return {
    customerTotal,
    franchiseOwnerPayout,
    cleanerPayout,
    platformRevenue,
    marginPercent,
    economicsBand,
    headline,
    notes,
  };
}

function mapCandidate(candidate: DispatchCandidate): AdminBookingDispatchCandidate {
  const scoreLabel =
    candidate.score >= 90
      ? "Excellent"
      : candidate.score >= 75
        ? "Strong"
        : candidate.score >= 60
          ? "Usable"
          : candidate.score > 0
            ? "Weak"
            : "Unscored";

  return {
    foId: candidate.foId,
    label: candidate.label,
    rank: candidate.rank,
    score: candidate.score,
    scoreLabel,
    distanceMiles: candidate.distanceMiles,
    acceptanceRate: candidate.acceptanceRate,
    completionRate: candidate.completionRate,
    cancellationRate: candidate.cancellationRate,
    currentLoad: candidate.currentLoad,
    economicsFit: candidate.economicsFit,
    proofFit: candidate.proofFit,
    riskFlags: candidate.riskFlags,
    strengths: candidate.strengths,
    degraders: candidate.degraders,
    recommended: candidate.recommended,
  };
}

function buildCandidates(screen: BookingScreen | undefined): AdminBookingDispatchCandidate[] {
  const candidates = screen?.dispatchCandidates ?? [];
  if (candidates.length > 0) {
    return candidates.map(mapCandidate).sort((left, right) => left.rank - right.rank);
  }

  if (!screen?.assignedFoId && !screen?.assignedFoLabel) return [];

  return [
    {
      foId: screen.assignedFoId ?? "assigned-fo",
      label: screen.assignedFoLabel ?? `FO ${screen.assignedFoId ?? "assigned"}`,
      rank: 1,
      score: 70,
      scoreLabel: "Assigned",
      economicsFit: "Current assignment already selected",
      proofFit: "Use proof + reliability to validate",
      riskFlags: [],
      strengths: ["Existing owner already attached"],
      degraders: [],
      recommended: true,
    },
  ];
}

function buildTimeline(
  screen: BookingScreen | undefined,
  signal: OperationalBookingSignal | undefined,
): AdminBookingDispatchTimelineEvent[] {
  const history = screen?.dispatchHistory ?? [];

  if (history.length > 0) {
    return history
      .map((event, index) => ({
        id: event.id ?? `${event.timestamp}-${index}`,
        timestamp: event.timestamp,
        title: event.title,
        detail: event.detail,
        tone: event.tone ?? "neutral",
      }))
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      );
  }

  const effectiveSignal = signal ?? screen?.signals;

  const fallback: AdminBookingDispatchTimelineEvent[] = [];
  if (effectiveSignal) {
    fallback.push({
      id: "signal-created",
      timestamp: effectiveSignal.signalTimestamp ?? new Date().toISOString(),
      title: "Portfolio signal recorded",
      detail:
        buildSignalFlagsFromPortfolioSignal(effectiveSignal).join(" • ") ||
        "Booking entered the portfolio monitoring layer.",
      tone:
        effectiveSignal.slaMiss || effectiveSignal.noAcceptance
          ? "critical"
          : effectiveSignal.reassignment || effectiveSignal.noShowRisk
            ? "warning"
            : "neutral",
    });
  }

  fallback.push({
    id: "booking-open",
    timestamp: new Date().toISOString(),
    title: "Dispatch detail opened",
    detail: "Admin is reviewing assignment quality, economics, and governance posture.",
    tone: "neutral",
  });

  return fallback;
}

function inferDefaultAction(
  governance: AdminBookingDispatchGovernance,
  candidates: AdminBookingDispatchCandidate[],
): { action: AdminDispatchAction; reason: string } {
  if (governance.consistencyState === "drift") {
    return {
      action: "reassign",
      reason:
        "Governance drift is high enough that the operator should actively change the path, not passively approve it.",
    };
  }

  if (governance.riskFlags.includes("No-show risk")) {
    return {
      action: "request_review",
      reason:
        "Proof and reliability should be explicitly reviewed before confirming this assignment.",
    };
  }

  if (governance.riskFlags.includes("Overload risk")) {
    return {
      action: "hold",
      reason:
        "Capacity risk is elevated, so a brief hold is safer than forcing a fragile assignment.",
    };
  }

  if (candidates.length === 0) {
    return {
      action: "escalate",
      reason:
        "There are no candidate rankings available, so the decision should move to a tighter control path.",
    };
  }

  return {
    action: "approve_assignment",
    reason: "The booking looks stable enough to approve the strongest candidate path.",
  };
}

function findNormalizedScreen(
  bookingScreens: unknown[],
  bookingId: string,
): BookingScreen | undefined {
  return bookingScreens
    .map(normalizeBookingScreen)
    .filter((value): value is BookingScreen => Boolean(value))
    .find((screen) => screen.booking.id === bookingId);
}

export function buildAdminBookingDispatchDetailModel(input: {
  bookingId: string;
  bookingScreens: unknown[];
  source?: string;
}): AdminBookingDispatchDetailModel {
  const snapshotSource: BuildSnapshotInput["source"] =
    (input.source as BuildSnapshotInput["source"] | undefined) ?? "admin_console";

  const snapshot = buildPortfolioOperationalSnapshot({
    bookingScreens: input.bookingScreens,
    source: snapshotSource,
  });

  const signal = snapshot.bookingSignals.find((s) => s.bookingId === input.bookingId);

  const screen = findNormalizedScreen(input.bookingScreens, input.bookingId);
  const contractSignal = signal ?? screen?.signals;

  const candidates = buildCandidates(screen);
  const governance = buildGovernance(contractSignal, candidates);
  const economics = buildEconomics(screen);
  const timeline = buildTimeline(screen, signal);
  const defaultAction = inferDefaultAction(governance, candidates);

  let dispatchHeadline = "Assignment path is ready for operator confirmation.";
  if (governance.consistencyState === "watch") {
    dispatchHeadline =
      "Assignment path is viable, but needs an explicit operator check before proceeding.";
  }
  if (governance.consistencyState === "drift") {
    dispatchHeadline =
      "Assignment path is not clean enough to approve without intervention.";
  }

  return {
    summary: {
      bookingId: input.bookingId,
      serviceLabel: screen?.booking.serviceLabel ?? "Cleaning service",
      customerName: screen?.booking.customerName ?? "Customer",
      locationLabel: screen?.booking.locationLabel ?? "Location unavailable",
      scheduledStartLabel: formatDateTime(screen?.booking.scheduledStart),
      statusLabel: titleize(screen?.booking.status ?? "Unknown status"),
      dispatchHeadline,
      assignedFoLabel: screen?.assignedFoLabel ?? (candidates[0] ? candidates[0].label : undefined),
      signalFlags: buildSignalFlagsFromPortfolioSignal(contractSignal),
    },
    candidates,
    economics,
    governance,
    timeline,
    defaultAction: defaultAction.action,
    defaultActionReason: defaultAction.reason,
  };
}
