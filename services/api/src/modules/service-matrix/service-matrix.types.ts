import type { BookingMatchMode } from "../fo/service-matching-policy";
import type { ServiceSegment } from "../crew-capacity/crew-capacity-policy";

/**
 * Canonical job slice for matrix evaluation (mirrors `JobMatchInput` fields used in `matchFOs` gates).
 * Plain JSON-friendly primitives only.
 */
export type JobContext = {
  lat: number;
  lng: number;
  squareFootage: number;
  estimatedLaborMinutes: number;
  recommendedTeamSize: number;
  serviceType?: string;
  serviceSegment?: ServiceSegment;
  bookingMatchMode?: BookingMatchMode;
  /**
   * Estimate- or intake-derived risk markers (advisory). When non-empty, façade surfaces
   * `review_required` without failing hard eligibility — matches V1 risk-layer docs.
   */
  riskFlags?: string[];
};

/** Non-authoritative evaluation mode (see `SERVICE_MATRIX_IMPLEMENTATION_PLAN_V1` / flags). */
export type MatrixEvaluationMode = "shadow" | "enforce";

export type MatrixDecision =
  | "eligible"
  | "ineligible"
  | "review_required"
  | "shadow_only";

/**
 * Stable machine codes for matrix explainability (`SERVICE_MATRIX_OBSERVABILITY_V1` §3).
 */
export type MatrixReasonCode =
  | "FO_NOT_ACTIVE"
  | "FO_SAFETY_HOLD"
  | "FO_DELETED"
  | "FO_BANNED"
  | "SUPPLY_READINESS_OK"
  | "FO_MISSING_COORDINATES"
  | "FO_INVALID_COORDINATES"
  | "FO_INVALID_TRAVEL_CONSTRAINT"
  | "FO_NO_SCHEDULING_SOURCE"
  | "FO_INVALID_CAPACITY_CONFIG"
  | "EXECUTION_PROVIDER_MISMATCH"
  | "TRAVEL_WITHIN_MAX"
  | "TRAVEL_EXCEEDS_MAX"
  | "SERVICE_TYPE_ALLOWED"
  | "SERVICE_TYPE_NOT_IN_FO_ALLOWLIST"
  | "COMMERCIAL_SERVICE_WHITELIST_REQUIRED"
  | "SQFT_WITHIN_MAX"
  | "SQFT_EXCEEDS_FO_MAX"
  | "PER_JOB_LABOR_WITHIN_MAX"
  | "PER_JOB_LABOR_EXCEEDS_FO_MAX"
  | "WORKLOAD_MIN_CREW_SATISFIED"
  | "WORKLOAD_MIN_CREW_NOT_MET"
  | "DAILY_LABOR_UNDER_CAP"
  | "DAILY_LABOR_CAP_EXCEEDED"
  | "RISK_FLAGS_PRESENT"
  | "MANUAL_REVIEW_SUGGESTED";

export type MatrixReasonSeverity = "hard" | "advisory";

export type MatrixPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined;

export type MatrixReasonDetail = Record<string, MatrixPrimitive | MatrixPrimitive[]>;

export type MatrixReason = {
  code: MatrixReasonCode;
  pass: boolean;
  severity?: MatrixReasonSeverity;
  detail?: MatrixReasonDetail;
};

/** Normalized metrics for one candidate after a successful hard evaluation. */
export type MatrixCandidateResult = {
  foId: string;
  travelMinutesRounded: number;
  workloadMinCrew: number;
  assignedCrewSize: number;
};

/**
 * Outcome of evaluating one FO-shaped candidate against a job context.
 * Ordering of `checks` follows supply → execution → geography → scale → crew → service → daily cap.
 */
export type MatrixEvaluationResult = {
  candidate: MatrixCandidateResult;
  decision: MatrixDecision;
  /** True when all hard checks pass (matches `matchFOs` continue-chain for modeled dimensions). */
  eligible: boolean;
  mode: MatrixEvaluationMode;
  checks: MatrixReason[];
  advisory: MatrixReason[];
  /** First hard failing code, if any. */
  primaryFailureCode?: MatrixReasonCode;
};

/**
 * FO-shaped inputs for pure evaluation (no Prisma types).
 * `committedLaborMinutesToday` replaces live DB reads against `booking` for daily cap parity.
 */
export type MatrixCandidateInput = {
  foId: string;
  franchiseOwnerUserId: string;
  providerId: string | null;
  providerUserId: string | null | undefined;
  /** Must be `active` for customer-path pool parity (`getEligibleFOs`). */
  status: string;
  safetyHold: boolean;
  isDeleted?: boolean;
  isBanned?: boolean;
  homeLat: number | null;
  homeLng: number | null;
  maxTravelMinutes: number | null;
  maxDailyLaborMinutes: number | null;
  maxLaborMinutes: number | null;
  maxSquareFootage: number | null;
  scheduleRowCount: number;
  teamSize: number | null;
  minCrewSize: number | null;
  preferredCrewSize: number | null;
  maxCrewSize: number | null;
  matchableServiceTypes: string[] | null | undefined;
  /**
   * Sum of already-committed labor minutes for the franchise owner for the target calendar day.
   * Defaults to 0 when omitted (parity with “no bookings today” in tests).
   */
  committedLaborMinutesToday?: number;
};

export type MatrixEvaluateOptions = {
  mode?: MatrixEvaluationMode;
};
