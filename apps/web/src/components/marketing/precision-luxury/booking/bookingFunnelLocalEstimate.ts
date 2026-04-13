import { buildEstimateInputForApi } from "@/lib/bookings/estimateInputFromEstimator";
import {
  generateEstimate,
  type ProblemType,
  type SurfaceType,
} from "@/lib/estimator/estimateEngine";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import type { BookingFlowState } from "./bookingFlowTypes";

const DEFAULT_SQFT = 1400;

/**
 * Mirrors `extractSqftFromHomeSize` in `services/api/.../intake-to-estimate.mapper.ts`
 * so client-side indicative math stays aligned with how the API interprets `homeSize`.
 */
export function extractSqftFromBookingHomeSize(raw: string): number {
  const s = String(raw ?? "").replace(/,/g, "");
  const m = s.match(/(\d{3,5})\b/);
  if (m) {
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(20000, n);
  }
  const any = s.match(/(\d+)/);
  if (any) {
    const n = Number.parseInt(any[1], 10);
    if (Number.isFinite(n) && n > 0) {
      if (n < 300) return DEFAULT_SQFT;
      return Math.min(20000, n);
    }
  }
  return DEFAULT_SQFT;
}

function mapSurface(): SurfaceType {
  return "whole_home";
}

function mapProblem(state: BookingFlowState): ProblemType {
  if (isDeepCleaningBookingServiceId(state.serviceId)) return "deep_clean";
  const f = String(state.frequency ?? "").toLowerCase();
  if (f.includes("one")) return "deep_clean";
  return "standard_clean";
}

export type FunnelReviewEstimate = {
  priceCents: number;
  durationMinutes: number;
  confidence: number;
  source: "server" | "local";
};

/**
 * Simplified indicative estimate using the same client helpers as the legacy
 * `EstimatorForm` demo (not the primary public booking path).
 * `buildEstimateInputForApi` is invoked so funnel-derived params stay aligned with
 * the legacy POST /bookings payload shape (reuse for Phase 3); display uses `generateEstimate` only.
 */
export function computeBookingFunnelLocalEstimate(
  state: BookingFlowState,
): FunnelReviewEstimate | null {
  const sqft = extractSqftFromBookingHomeSize(state.homeSize);
  if (!Number.isFinite(sqft) || sqft <= 0) return null;

  const surface = mapSurface();
  const problem = mapProblem(state);

  void buildEstimateInputForApi({ sqft, surface, problem });

  const r = generateEstimate({
    squareFootage: sqft,
    surface,
    problem,
  });

  const priceCents = Math.max(0, Math.round(r.finalPrice * 100));
  const durationMinutes = Math.max(15, Math.round(r.durationHours * 60));
  /** Low fixed confidence — local model is intentionally coarse vs server estimator. */
  const confidence = 0.42;

  return {
    priceCents,
    durationMinutes,
    confidence,
    source: "local",
  };
}
