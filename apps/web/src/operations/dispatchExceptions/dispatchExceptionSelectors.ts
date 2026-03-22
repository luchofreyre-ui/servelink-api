import type { PortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";
import { ADMIN_DECISION_STANDARDS } from "@/standards/adminDecisionStandardRegistry";
import { normalizeBookingScreen } from "@/contracts/contractNormalization";
import type { BookingScreen } from "@/contracts/bookingScreen";
import type { DispatchException } from "./dispatchExceptionTypes";

type StandardLike = {
  title?: string;
  scenarioSignature?: string;
  recommendedDecisionPath?: string;
};

function isBookingScreen(value: BookingScreen | undefined): value is BookingScreen {
  return Boolean(value);
}

export function buildDispatchExceptions(
  snapshot: PortfolioOperationalSnapshot,
): DispatchException[] {
  const exceptions: DispatchException[] = [];

  snapshot.bookingSignals.forEach((signal) => {
    if (signal.noAcceptance) {
      exceptions.push({
        id: `no_accept_${signal.bookingId}`,
        bookingId: signal.bookingId,
        foId: signal.foId,
        type: "NO_ACCEPTANCE",
        severity: "high",
        createdAt: signal.signalTimestamp,
        summary: "No FO accepted the job",
      });
    }

    if (signal.offerExpired) {
      exceptions.push({
        id: `expired_${signal.bookingId}`,
        bookingId: signal.bookingId,
        foId: signal.foId,
        type: "EXPIRED_OFFER",
        severity: "medium",
        createdAt: signal.signalTimestamp,
        summary: "Offer expired before acceptance",
      });
    }

    if (signal.slaMiss) {
      exceptions.push({
        id: `sla_${signal.bookingId}`,
        bookingId: signal.bookingId,
        foId: signal.foId,
        type: "SLA_MISS",
        severity: "high",
        createdAt: signal.signalTimestamp,
        summary: "Start SLA missed — redispatched",
      });
    }

    if (signal.reassignment) {
      exceptions.push({
        id: `reassign_${signal.bookingId}`,
        bookingId: signal.bookingId,
        foId: signal.foId,
        type: "REASSIGNMENT",
        severity: "medium",
        createdAt: signal.signalTimestamp,
        summary: "Booking requires reassignment review",
      });
    }

    if (signal.noShowRisk) {
      exceptions.push({
        id: `no_show_${signal.bookingId}`,
        bookingId: signal.bookingId,
        foId: signal.foId,
        type: "NO_SHOW_RISK",
        severity: "high",
        createdAt: signal.signalTimestamp,
        summary: "No-show risk detected",
      });
    }

    if (signal.overloadRisk) {
      exceptions.push({
        id: `overload_${signal.bookingId}`,
        bookingId: signal.bookingId,
        foId: signal.foId,
        type: "OVERLOAD_RISK",
        severity: "medium",
        createdAt: signal.signalTimestamp,
        summary: "FO overload risk detected",
      });
    }
  });

  return exceptions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function findStandardForDispatchException(
  exception: DispatchException,
): StandardLike | undefined {
  const signatureMap: Record<DispatchException["type"], string[]> = {
    NO_ACCEPTANCE: ["accept", "unaccepted", "no acceptance"],
    EXPIRED_OFFER: ["offer expired", "expiry", "expired"],
    SLA_MISS: ["sla", "late start", "missed start"],
    REASSIGNMENT: ["reassign", "reassignment"],
    NO_SHOW_RISK: ["no-show", "proof", "attendance"],
    OVERLOAD_RISK: ["overload", "capacity", "load"],
  };

  const needles = signatureMap[exception.type];

  return ADMIN_DECISION_STANDARDS.find((standard) => {
    const haystack = [standard.title, standard.scenarioSignature, standard.recommendedDecisionPath]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return needles.some((needle) => haystack.includes(needle));
  });
}

export function normalizeExceptionBookingScreens(input: unknown[]): BookingScreen[] {
  return input.map(normalizeBookingScreen).filter(isBookingScreen);
}
