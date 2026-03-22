import type { BookingBillingModel } from "./bookingBillingModel";
import type { BookingScreen, DispatchHistoryEvent } from "./bookingScreen";
import type { DispatchCandidate } from "./dispatchCandidate";
import type { OperationalSignalContract } from "./operationalSignal";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickFirstString(source: UnknownRecord | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = getString(source?.[key]);
    if (value) return value;
  }
  return undefined;
}

function pickFirstNumber(source: UnknownRecord | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = getNumber(source?.[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function pickFirstBoolean(source: UnknownRecord | undefined, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = getBoolean(source?.[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function getNestedRecord(source: UnknownRecord | undefined, keys: string[]): UnknownRecord | undefined {
  for (const key of keys) {
    const next = getRecord(source?.[key]);
    if (next) return next;
  }
  return undefined;
}

function getNestedArray(source: UnknownRecord | undefined, keys: string[]): unknown[] {
  for (const key of keys) {
    const next = source?.[key];
    if (Array.isArray(next)) return next;
  }
  return [];
}

export function normalizeDispatchCandidate(input: unknown, index = 0): DispatchCandidate | undefined {
  const source = getRecord(input);
  if (!source) return undefined;

  const foId =
    pickFirstString(source, ["foId", "franchiseOwnerId", "id"]) ?? `candidate-${index + 1}`;

  const label =
    pickFirstString(source, ["label", "foName", "name", "displayName"]) ?? `FO ${foId}`;

  const rank = pickFirstNumber(source, ["rank", "position"]) ?? index + 1;
  const score = pickFirstNumber(source, ["score", "dispatchScore", "effectiveScore"]) ?? 0;

  const strengths = asArray(source.strengths)
    .map(getString)
    .filter((value): value is string => Boolean(value));

  const degraders = asArray(source.degraders)
    .map(getString)
    .filter((value): value is string => Boolean(value));

  const riskFlags = asArray(source.riskFlags)
    .map(getString)
    .filter((value): value is string => Boolean(value));

  return {
    foId,
    label,
    rank,
    score,
    recommended: getBoolean(source.recommended) ?? rank === 1,
    distanceMiles: pickFirstNumber(source, ["distanceMiles", "distance"]),
    acceptanceRate: pickFirstNumber(source, ["acceptanceRate"]),
    completionRate: pickFirstNumber(source, ["completionRate"]),
    cancellationRate: pickFirstNumber(source, ["cancellationRate"]),
    currentLoad: pickFirstNumber(source, ["currentLoad", "load"]),
    economicsFit: pickFirstString(source, ["economicsFit", "economicsLabel"]),
    proofFit: pickFirstString(source, ["proofFit", "proofLabel"]),
    strengths,
    degraders,
    riskFlags,
  };
}

export function normalizeBookingBillingModel(input: unknown): BookingBillingModel | undefined {
  const source = getRecord(input);
  if (!source) return undefined;

  const customerTotal = pickFirstNumber(source, [
    "customerTotal",
    "grossTotal",
    "total",
    "customerPrice",
    "bookingTotal",
  ]);

  const franchiseOwnerPayout = pickFirstNumber(source, [
    "franchiseOwnerPayout",
    "foPayout",
    "foNet",
    "franchisePayout",
  ]);

  const cleanerPayout = pickFirstNumber(source, [
    "cleanerPayout",
    "providerPayout",
    "laborPayout",
  ]);

  const platformRevenue = pickFirstNumber(source, [
    "platformRevenue",
    "platformNet",
    "serviceRevenue",
    "marginDollars",
  ]);

  let marginPercent = pickFirstNumber(source, [
    "marginPercent",
    "platformMarginPercent",
    "marginPct",
  ]);

  if (
    marginPercent === undefined &&
    customerTotal !== undefined &&
    platformRevenue !== undefined &&
    customerTotal > 0
  ) {
    marginPercent = (platformRevenue / customerTotal) * 100;
  }

  return {
    customerTotal,
    franchiseOwnerPayout,
    cleanerPayout,
    platformRevenue,
    marginPercent,
  };
}

export function normalizeDispatchHistoryEvent(input: unknown, index = 0): DispatchHistoryEvent | undefined {
  const source = getRecord(input);
  if (!source) return undefined;

  const timestamp =
    pickFirstString(source, ["timestamp", "createdAt", "at"]) ?? new Date().toISOString();

  const title =
    pickFirstString(source, ["title", "event", "type", "label"]) ?? `Dispatch event ${index + 1}`;

  const detail =
    pickFirstString(source, ["detail", "summary", "description"]) ??
    "Operational event recorded for this booking.";

  const rawTone = pickFirstString(source, ["tone", "severity", "state"]);
  const tone =
    rawTone === "positive" || rawTone === "warning" || rawTone === "critical"
      ? rawTone
      : "neutral";

  return {
    id: pickFirstString(source, ["id"]),
    timestamp,
    title,
    detail,
    tone,
  };
}

export function normalizeOperationalSignalContract(input: unknown): OperationalSignalContract | undefined {
  const screen = getRecord(input);
  if (!screen) return undefined;

  const nestedBooking = getNestedRecord(screen, ["booking"]);
  const dispatch = getNestedRecord(screen, ["dispatch"]);
  const ops = getNestedRecord(screen, ["ops"]);

  const bookingId =
    pickFirstString(screen, ["bookingId", "id"]) ?? pickFirstString(nestedBooking, ["id"]);

  if (!bookingId) return undefined;

  const foId =
    pickFirstString(screen, ["assignedFoId", "foId", "franchiseOwnerId"]) ??
    pickFirstString(nestedBooking, ["assignedFoId", "foId", "franchiseOwnerId"]) ??
    pickFirstString(dispatch, ["assignedFoId", "foId", "franchiseOwnerId"]) ??
    pickFirstString(ops, ["assignedFoId", "foId", "franchiseOwnerId"]);

  const signalTimestamp =
    pickFirstString(screen, ["signalTimestamp", "createdAt"]) ??
    pickFirstString(dispatch, ["signalTimestamp", "createdAt", "updatedAt"]) ??
    pickFirstString(ops, ["signalTimestamp", "createdAt", "updatedAt"]) ??
    new Date().toISOString();

  return {
    bookingId,
    foId,
    signalTimestamp,
    noAcceptance:
      pickFirstBoolean(screen, ["noAcceptance"]) ??
      pickFirstBoolean(dispatch, ["noAcceptance"]) ??
      pickFirstBoolean(ops, ["noAcceptance"]) ??
      false,
    offerExpired:
      pickFirstBoolean(screen, ["offerExpired"]) ??
      pickFirstBoolean(dispatch, ["offerExpired"]) ??
      pickFirstBoolean(ops, ["offerExpired"]) ??
      false,
    slaMiss:
      pickFirstBoolean(screen, ["slaMiss"]) ??
      pickFirstBoolean(dispatch, ["slaMiss"]) ??
      pickFirstBoolean(ops, ["slaMiss"]) ??
      false,
    reassignment:
      pickFirstBoolean(screen, ["reassignment"]) ??
      pickFirstBoolean(dispatch, ["reassignment"]) ??
      pickFirstBoolean(ops, ["reassignment"]) ??
      false,
    noShowRisk:
      pickFirstBoolean(screen, ["noShowRisk"]) ??
      pickFirstBoolean(dispatch, ["noShowRisk"]) ??
      pickFirstBoolean(ops, ["noShowRisk"]) ??
      false,
    overloadRisk:
      pickFirstBoolean(screen, ["overloadRisk"]) ??
      pickFirstBoolean(dispatch, ["overloadRisk"]) ??
      pickFirstBoolean(ops, ["overloadRisk"]) ??
      Boolean(
        pickFirstBoolean(screen, ["overloadedContext"]) ??
          pickFirstBoolean(dispatch, ["overloadedContext"]) ??
          pickFirstBoolean(ops, ["overloadedContext"]),
      ),
  };
}

export function normalizeBookingScreen(input: unknown): BookingScreen | undefined {
  const screen = getRecord(input);
  if (!screen) return undefined;

  const nestedBooking = getNestedRecord(screen, ["booking"]);

  const bookingId =
    pickFirstString(screen, ["bookingId", "id"]) ?? pickFirstString(nestedBooking, ["id"]);

  if (!bookingId) return undefined;

  const booking = {
    id: bookingId,
    status:
      pickFirstString(screen, ["statusLabel", "status"]) ??
      pickFirstString(nestedBooking, ["statusLabel", "status"]),
    serviceLabel:
      pickFirstString(screen, ["serviceLabel", "serviceName", "serviceType"]) ??
      pickFirstString(nestedBooking, ["serviceLabel", "serviceName", "serviceType"]),
    customerName:
      pickFirstString(screen, ["customerName", "clientName"]) ??
      pickFirstString(nestedBooking, ["customerName", "clientName"]),
    locationLabel:
      pickFirstString(screen, ["locationLabel", "address", "cityLabel"]) ??
      pickFirstString(nestedBooking, ["locationLabel", "address", "cityLabel"]),
    scheduledStart:
      pickFirstString(screen, ["scheduledStart", "scheduledAt", "startAt"]) ??
      pickFirstString(nestedBooking, ["scheduledStart", "scheduledAt", "startAt"]),
  };

  const rawCandidates = getNestedArray(screen, [
    "dispatchCandidates",
    "candidateRankings",
    "candidatePool",
    "rankedCandidates",
  ]);

  const dispatchCandidates = rawCandidates
    .map((item, index) => normalizeDispatchCandidate(item, index))
    .filter((value): value is DispatchCandidate => Boolean(value))
    .sort((left, right) => left.rank - right.rank);

  const assignedFoId =
    pickFirstString(screen, ["assignedFoId", "foId", "franchiseOwnerId"]) ??
    pickFirstString(nestedBooking, ["assignedFoId", "foId", "franchiseOwnerId"]);

  const assignedFoLabel =
    pickFirstString(screen, ["assignedFoName", "foName", "franchiseOwnerName"]) ??
    pickFirstString(nestedBooking, ["assignedFoName", "foName", "franchiseOwnerName"]);

  const billingSource =
    getNestedRecord(screen, ["billing", "bookingBilling", "economics"]) ?? screen;

  const billing = normalizeBookingBillingModel(billingSource);

  const rawHistory = getNestedArray(screen, ["dispatchHistory", "timeline", "events", "activity"]);
  const dispatchHistory = rawHistory
    .map((item, index) => normalizeDispatchHistoryEvent(item, index))
    .filter((value): value is DispatchHistoryEvent => Boolean(value));

  const signals = normalizeOperationalSignalContract(screen);

  return {
    booking,
    assignedFoId,
    assignedFoLabel,
    dispatchCandidates,
    billing,
    dispatchHistory,
    signals,
  };
}
