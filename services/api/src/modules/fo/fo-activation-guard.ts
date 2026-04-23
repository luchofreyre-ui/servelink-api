import { BadRequestException } from "@nestjs/common";
import { FoStatus, type PrismaClient } from "@prisma/client";
import { evaluateFoExecutionReadiness } from "./fo-execution-readiness";
import {
  evaluateFoSupplyReadiness,
  type FoSupplyReadinessInput,
} from "./fo-supply-readiness";

export const FO_ACTIVATION_BLOCKED_CODE = "FO_ACTIVATION_BLOCKED" as const;

export type FoActivationEvaluation = {
  ok: boolean;
  reasons: string[];
};

/**
 * True when this FO would be included in `FoService.getEligibleFOs` (active supply pool).
 */
export function isFranchiseOwnerInActiveBookingPool(row: {
  status: string;
  safetyHold?: boolean | null;
  isDeleted?: boolean | null;
  isBanned?: boolean | null;
}): boolean {
  const status = String(row.status ?? "").toLowerCase();
  if (status !== String(FoStatus.active)) return false;
  if (row.isDeleted === true || row.isBanned === true) return false;
  if (Boolean(row.safetyHold)) return false;
  return true;
}

/**
 * When an FO is (or would be) in the active booking pool, supply primitives must pass.
 * Reuses `evaluateFoSupplyReadiness` — no duplicate supply rules.
 */
export function evaluateFoActivationSupplyReadiness(params: {
  status: string;
  safetyHold?: boolean | null;
  isDeleted?: boolean | null;
  isBanned?: boolean | null;
  supplyInput: FoSupplyReadinessInput;
}): FoActivationEvaluation {
  if (!isFranchiseOwnerInActiveBookingPool(params)) {
    return { ok: true, reasons: [] };
  }

  const supply = evaluateFoSupplyReadiness(params.supplyInput);
  if (!supply.ok) {
    return { ok: false, reasons: [...supply.reasons] };
  }
  return { ok: true, reasons: [] };
}

export function throwIfFoActivationBlocked(evaluation: FoActivationEvaluation) {
  if (evaluation.ok) return;
  throw new BadRequestException({
    code: FO_ACTIVATION_BLOCKED_CODE,
    reasons: evaluation.reasons,
    message:
      "Activation blocked until FO supply readiness requirements are met.",
  });
}

type ScalarPatch = string | number | boolean | null | undefined;

function resolvePatchValue(
  current: ScalarPatch,
  patch: unknown,
): ScalarPatch {
  if (patch === undefined) return current;
  if (patch === null) return null;
  if (typeof patch !== "object" || patch === null) {
    return patch as ScalarPatch;
  }
  const o = patch as Record<string, unknown>;
  if ("set" in o) return o.set as ScalarPatch;
  if ("increment" in o && typeof o.increment === "number") {
    const base = typeof current === "number" ? current : 0;
    return base + o.increment;
  }
  if ("decrement" in o && typeof o.decrement === "number") {
    const base = typeof current === "number" ? current : 0;
    return base - o.decrement;
  }
  return current;
}

/**
 * Merges `FranchiseOwnerUpdateInput` onto a loaded row for activation checks.
 * Only fields that can affect supply / pool membership are merged deeply.
 */
export function mergeFranchiseOwnerUpdateData(
  current: {
    status: string;
    safetyHold: boolean | null;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
    isDeleted?: boolean | null;
    isBanned?: boolean | null;
  },
  data: Record<string, unknown>,
): typeof current {
  const out = { ...current };
  const keys = [
    "status",
    "safetyHold",
    "homeLat",
    "homeLng",
    "maxTravelMinutes",
    "maxDailyLaborMinutes",
    "maxLaborMinutes",
    "maxSquareFootage",
    "isDeleted",
    "isBanned",
  ] as const;
  for (const key of keys) {
    if (!(key in data)) continue;
    (out as Record<string, unknown>)[key] = resolvePatchValue(
      (current as Record<string, unknown>)[key] as ScalarPatch,
      data[key],
    );
  }
  return out;
}

export async function loadFranchiseOwnerForActivationCheck(
  client: PrismaClient,
  where: { id: string } | { userId: string },
) {
  return client.franchiseOwner.findFirst({
    where,
    include: {
      _count: { select: { foSchedules: true } },
      provider: { select: { userId: true } },
    },
  });
}

export function activationEvaluationFromFranchiseOwnerRow(
  row: {
    status: string;
    safetyHold: boolean | null;
    isDeleted?: boolean | null;
    isBanned?: boolean | null;
    userId?: string;
    providerId?: string | null;
    provider?: { userId: string } | null;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
    _count: { foSchedules: number };
  },
): FoActivationEvaluation {
  const supplyEval = evaluateFoActivationSupplyReadiness({
    status: row.status,
    safetyHold: row.safetyHold,
    isDeleted: row.isDeleted,
    isBanned: row.isBanned,
    supplyInput: {
      homeLat: row.homeLat,
      homeLng: row.homeLng,
      maxTravelMinutes: row.maxTravelMinutes,
      maxDailyLaborMinutes: row.maxDailyLaborMinutes,
      maxLaborMinutes: row.maxLaborMinutes,
      maxSquareFootage: row.maxSquareFootage,
      scheduleRowCount: row._count.foSchedules,
    },
  });

  if (!supplyEval.ok) {
    return supplyEval;
  }

  if (!isFranchiseOwnerInActiveBookingPool(row)) {
    return supplyEval;
  }

  const foUserId = row.userId;
  if (!foUserId) {
    return supplyEval;
  }

  /**
   * Only evaluate execution when a provider relation was loaded (or explicitly null).
   * Rows without `provider` on the object skip this check (e.g. narrow Prisma selects).
   */
  if (row.provider === undefined) {
    return supplyEval;
  }

  const exec = evaluateFoExecutionReadiness({
    franchiseOwnerUserId: foUserId,
    providerId: row.providerId ?? null,
    providerUserId: row.provider?.userId,
  });

  if (!exec.ok) {
    return { ok: false, reasons: [...supplyEval.reasons, ...exec.reasons] };
  }

  return supplyEval;
}
