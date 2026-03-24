/**
 * Product definition for deep clean: single visit vs 3-visit phased program.
 * Bundle + task definitions live in `modules/scope`; labor split stays deterministic here.
 */

import { CLEANING_PRICING_POLICY_V1 } from "../pricing/pricing-policy";
import {
  DEEP_CLEAN_BUNDLE_IDS,
  getBundleById,
} from "../scope/task-bundles";
import {
  bundleLabelsForIds,
  labelsForTaskIds,
} from "../scope/scope-helpers";

/** Re-export stable bundle id constants for estimator / intake callers. */
export { DEEP_CLEAN_BUNDLE_IDS } from "../scope/task-bundles";

export type DeepCleanProgramType =
  | "single_visit_deep_clean"
  | "phased_deep_clean_program";

export type DeepCleanProgramVisitEstimate = {
  visitIndex: number;
  label: string;
  estimatedLaborMinutes: number;
  estimatedDurationMinutes: number;
  estimatedPriceCents: number;
  /** Canonical bundle id(s) for this visit (usually one). */
  taskBundleIds: string[];
  /** Task catalog ids in execution order for this visit. */
  taskIds: string[];
  /** Human-readable bundle titles aligned with taskBundleIds. */
  bundleLabels: string[];
  /** Task labels (same order as taskIds); stable for legacy JSON consumers. */
  taskLabels: string[];
  summary: string;
};

export type DeepCleanProgramEstimate = {
  programType: DeepCleanProgramType;
  visitCount: number;
  visits: DeepCleanProgramVisitEstimate[];
};

/** Visit 1: heavy foundation — 52% of phased labor */
const PHASE_LABOR_WEIGHTS = [0.52, 0.26, 0.22] as const;

function splitLaborThreeWays(totalMinutes: number): [number, number, number] {
  const t = Math.max(0, Math.round(totalMinutes));
  if (t === 0) return [0, 0, 0];
  const w = PHASE_LABOR_WEIGHTS;
  const a = Math.round(t * w[0]);
  const b = Math.round(t * w[1]);
  const c = Math.max(0, t - a - b);
  return [a, b, c];
}

function laborToPriceCents(laborMinutes: number, hourlyRateCents: number): number {
  return Math.ceil((laborMinutes / 60) * hourlyRateCents);
}

function durationForVisit(laborMinutes: number, effectiveTeamSize: number): number {
  const team = Math.max(1, effectiveTeamSize);
  return Math.ceil(Math.max(0, laborMinutes) / team);
}

function buildVisitFromBundle(args: {
  visitIndex: number;
  visitTitle: string;
  bundleId: string;
  laborMinutes: number;
  team: number;
  priceCents: number;
  summaryOverride?: string;
}): DeepCleanProgramVisitEstimate {
  const bundle = getBundleById(args.bundleId);
  if (!bundle) {
    throw new Error(`deep-clean-program: unknown bundle ${args.bundleId}`);
  }
  const taskIds = [...bundle.taskIds];
  return {
    visitIndex: args.visitIndex,
    label: args.visitTitle,
    estimatedLaborMinutes: args.laborMinutes,
    estimatedDurationMinutes: durationForVisit(args.laborMinutes, args.team),
    estimatedPriceCents: args.priceCents,
    taskBundleIds: [args.bundleId],
    taskIds,
    bundleLabels: bundleLabelsForIds([args.bundleId]),
    taskLabels: labelsForTaskIds(taskIds),
    summary: args.summaryOverride ?? bundle.summary,
  };
}

/**
 * Builds visit-level program output. `adjustedLaborMinutes` must match the estimator’s
 * labor model total (same as used for aggregate quote).
 */
export function buildDeepCleanProgramEstimate(args: {
  mode: "single_visit" | "phased_3_visit";
  adjustedLaborMinutes: number;
  effectiveTeamSize: number;
  hourlyRateCents?: number;
}): DeepCleanProgramEstimate {
  const rate =
    args.hourlyRateCents ?? CLEANING_PRICING_POLICY_V1.hourlyRateCents;
  const T = Math.max(0, Math.round(args.adjustedLaborMinutes));
  const team = Math.max(1, args.effectiveTeamSize);
  const totalPriceCents = laborToPriceCents(T, rate);

  if (args.mode === "single_visit") {
    return {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      visits: [
        buildVisitFromBundle({
          visitIndex: 1,
          visitTitle: "Single visit — full deep clean",
          bundleId: DEEP_CLEAN_BUNDLE_IDS.SINGLE_SESSION_FULL,
          laborMinutes: T,
          team,
          priceCents: totalPriceCents,
          summaryOverride:
            "One visit completes the full deep clean scope (foundation + detail) as estimated.",
        }),
      ],
    };
  }

  const [m1, m2, m3] = splitLaborThreeWays(T);
  const visitsRaw = [
    buildVisitFromBundle({
      visitIndex: 1,
      visitTitle: "Visit 1 — Foundation reset (heavy deep clean)",
      bundleId: DEEP_CLEAN_BUNDLE_IDS.FOUNDATION,
      laborMinutes: m1,
      team,
      priceCents: 0,
      summaryOverride:
        "Full reset and heavy foundation: surfaces, kitchen/bath sanitation, floor baseline, touchpoints.",
    }),
    buildVisitFromBundle({
      visitIndex: 2,
      visitTitle: "Visit 2 — Maintenance + deep-clean bundle A",
      bundleId: DEEP_CLEAN_BUNDLE_IDS.DETAIL_BUNDLE_A,
      laborMinutes: m2,
      team,
      priceCents: 0,
      summaryOverride:
        "Maintenance-style coverage plus high-impact detail: kitchen/bath depth and priority baseboards.",
    }),
    buildVisitFromBundle({
      visitIndex: 3,
      visitTitle: "Visit 3 — Maintenance + deep-clean bundle B",
      bundleId: DEEP_CLEAN_BUNDLE_IDS.DETAIL_BUNDLE_B,
      laborMinutes: m3,
      team,
      priceCents: 0,
      summaryOverride:
        "Whole-home maintenance pass, remaining detail, floor finish, polish and handoff to recurring-ready state.",
    }),
  ];

  const prices = visitsRaw.map((v) =>
    laborToPriceCents(v.estimatedLaborMinutes, rate),
  );
  const sumPrices = prices.reduce((s, p) => s + p, 0);
  const delta = totalPriceCents - sumPrices;
  const adjustedLast = Math.max(0, prices[2] + delta);

  const visits: DeepCleanProgramVisitEstimate[] = visitsRaw.map((v, i) => ({
    ...v,
    estimatedPriceCents: i === 2 ? adjustedLast : prices[i],
  }));

  return {
    programType: "phased_deep_clean_program",
    visitCount: 3,
    visits,
  };
}
