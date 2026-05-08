import { Injectable } from "@nestjs/common";
import { clampCrewSizeForService } from "../crew-capacity/crew-capacity-policy";
import type { ServiceSegment } from "../crew-capacity/crew-capacity-policy";
import { resolveFranchiseOwnerCrewRange } from "../crew-capacity/franchise-owner-crew-range";
import { getWorkloadMinCrew } from "../crew-capacity/workload-min-crew";
import {
  computeAssignedCrewSize,
} from "../crew-capacity/assigned-crew-and-duration";
import { evaluateFoExecutionReadiness } from "../fo/fo-execution-readiness";
import { evaluateFoSupplyReadiness } from "../fo/fo-supply-readiness";
import { shouldServiceTypeActAsHardWhitelist } from "../fo/service-matching-policy";
import type {
  JobContext,
  MatrixCandidateInput,
  MatrixCandidateResult,
  MatrixEvaluationMode,
  MatrixEvaluationResult,
  MatrixEvaluateOptions,
  MatrixReason,
  MatrixReasonCode,
} from "./service-matrix.types";

/** Same haversine + road-speed assumption as `FoService.matchFOs` (no shared export today). */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function travelMinutes(distanceKm: number): number {
  const avgSpeedKmh = 40;
  return (distanceKm / avgSpeedKmh) * 60;
}

function firstSupplyFailureCode(
  reasons: readonly string[],
): MatrixReasonCode | undefined {
  const map: Record<string, MatrixReasonCode> = {
    FO_MISSING_COORDINATES: "FO_MISSING_COORDINATES",
    FO_INVALID_COORDINATES: "FO_INVALID_COORDINATES",
    FO_INVALID_TRAVEL_CONSTRAINT: "FO_INVALID_TRAVEL_CONSTRAINT",
    FO_NO_SCHEDULING_SOURCE: "FO_NO_SCHEDULING_SOURCE",
    FO_INVALID_CAPACITY_CONFIG: "FO_INVALID_CAPACITY_CONFIG",
  };
  for (const r of reasons) {
    const c = map[r];
    if (c) return c;
  }
  return undefined;
}

function finalizeResult(args: {
  candidate: MatrixCandidateResult;
  checks: MatrixReason[];
  advisory: MatrixReason[];
  mode: MatrixEvaluationMode;
}): MatrixEvaluationResult {
  const hardFailed = args.checks.filter(
    (c) => !c.pass && (c.severity ?? "hard") === "hard",
  );
  const primaryFailureCode = hardFailed[0]?.code;

  const eligible = hardFailed.length === 0;
  let decision: MatrixEvaluationResult["decision"];
  if (!eligible) {
    decision = "ineligible";
  } else if (args.advisory.length > 0) {
    decision = "review_required";
  } else if (args.mode === "shadow") {
    decision = "shadow_only";
  } else {
    decision = "eligible";
  }

  return {
    candidate: args.candidate,
    decision,
    eligible,
    mode: args.mode,
    checks: args.checks,
    advisory: args.advisory,
    primaryFailureCode,
  };
}

/**
 * Pure matrix evaluation for one candidate. Composes existing supply, execution, geography,
 * crew, service-policy, and capacity helpers used by `FoService.matchFOs` without I/O.
 */
export function evaluateServiceMatrixCandidate(
  job: JobContext,
  candidate: MatrixCandidateInput,
  options?: MatrixEvaluateOptions,
): MatrixEvaluationResult {
  const mode: MatrixEvaluationMode = options?.mode ?? "enforce";
  const checks: MatrixReason[] = [];
  const advisory: MatrixReason[] = [];

  const segment: ServiceSegment = job.serviceSegment ?? "residential";
  const serviceType = String(job.serviceType ?? "maintenance");
  const committed =
    candidate.committedLaborMinutesToday != null
      ? Math.max(0, Math.floor(Number(candidate.committedLaborMinutesToday)))
      : 0;

  const placeholderCandidate: MatrixCandidateResult = {
    foId: candidate.foId,
    travelMinutesRounded: 0,
    workloadMinCrew: 1,
    assignedCrewSize: 1,
  };

  if (candidate.isDeleted === true) {
    checks.push({
      code: "FO_DELETED",
      pass: false,
      severity: "hard",
    });
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }
  if (candidate.isBanned === true) {
    checks.push({
      code: "FO_BANNED",
      pass: false,
      severity: "hard",
    });
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }
  if (candidate.status !== "active") {
    checks.push({ code: "FO_NOT_ACTIVE", pass: false, severity: "hard" });
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }
  if (candidate.safetyHold) {
    checks.push({ code: "FO_SAFETY_HOLD", pass: false, severity: "hard" });
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const supply = evaluateFoSupplyReadiness({
    homeLat: candidate.homeLat,
    homeLng: candidate.homeLng,
    maxTravelMinutes: candidate.maxTravelMinutes,
    maxDailyLaborMinutes: candidate.maxDailyLaborMinutes,
    maxLaborMinutes: candidate.maxLaborMinutes,
    maxSquareFootage: candidate.maxSquareFootage,
    scheduleRowCount: candidate.scheduleRowCount,
  });
  if (supply.ok) {
    checks.push({
      code: "SUPPLY_READINESS_OK",
      pass: true,
      severity: "hard",
    });
  } else {
    const fc = firstSupplyFailureCode(supply.reasons) ?? "FO_INVALID_COORDINATES";
    checks.push({
      code: fc,
      pass: false,
      severity: "hard",
      detail: { reasons: [...supply.reasons] },
    });
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const exec = evaluateFoExecutionReadiness({
    franchiseOwnerUserId: candidate.franchiseOwnerUserId,
    providerId: candidate.providerId,
    providerUserId: candidate.providerUserId,
  });
  checks.push({
    code: "EXECUTION_PROVIDER_MISMATCH",
    pass: exec.ok,
    severity: "hard",
    detail: exec.ok ? { ok: true } : { reasons: [...exec.reasons] },
  });
  if (!exec.ok) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const homeLat = candidate.homeLat as number;
  const homeLng = candidate.homeLng as number;
  const dist = distanceKm(job.lat, job.lng, homeLat, homeLng);
  const travelMin = travelMinutes(dist);
  const travelOk =
    !candidate.maxTravelMinutes || travelMin <= candidate.maxTravelMinutes;
  checks.push({
    code: travelOk ? "TRAVEL_WITHIN_MAX" : "TRAVEL_EXCEEDS_MAX",
    pass: travelOk,
    severity: "hard",
    detail: {
      travelMinutes: travelMin,
      maxTravelMinutes: candidate.maxTravelMinutes,
    },
  });
  if (!travelOk) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const sqftOk =
    !candidate.maxSquareFootage ||
    job.squareFootage <= candidate.maxSquareFootage;
  checks.push({
    code: sqftOk ? "SQFT_WITHIN_MAX" : "SQFT_EXCEEDS_FO_MAX",
    pass: sqftOk,
    severity: "hard",
    detail: {
      squareFootage: job.squareFootage,
      maxSquareFootage: candidate.maxSquareFootage,
    },
  });
  if (!sqftOk) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const laborOk =
    !candidate.maxLaborMinutes ||
    job.estimatedLaborMinutes <= candidate.maxLaborMinutes;
  checks.push({
    code: laborOk ? "PER_JOB_LABOR_WITHIN_MAX" : "PER_JOB_LABOR_EXCEEDS_FO_MAX",
    pass: laborOk,
    severity: "hard",
    detail: {
      estimatedLaborMinutes: job.estimatedLaborMinutes,
      maxLaborMinutes: candidate.maxLaborMinutes,
    },
  });
  if (!laborOk) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const normRec = clampCrewSizeForService(
    serviceType,
    segment,
    job.recommendedTeamSize,
  );
  const crew = resolveFranchiseOwnerCrewRange({
    teamSize: candidate.teamSize,
    minCrewSize: candidate.minCrewSize ?? null,
    preferredCrewSize: candidate.preferredCrewSize ?? null,
    maxCrewSize: candidate.maxCrewSize ?? null,
  });
  const workloadMinCrew = getWorkloadMinCrew({
    estimatedLaborMinutes: job.estimatedLaborMinutes,
    squareFootage: job.squareFootage,
    serviceType,
  });
  const crewOk = crew.maxCrewSize >= workloadMinCrew;
  checks.push({
    code: crewOk ? "WORKLOAD_MIN_CREW_SATISFIED" : "WORKLOAD_MIN_CREW_NOT_MET",
    pass: crewOk,
    severity: "hard",
    detail: { workloadMinCrew, foMaxCrew: crew.maxCrewSize },
  });
  if (!crewOk) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const allowed = candidate.matchableServiceTypes;
  const enforceServiceWhitelist = shouldServiceTypeActAsHardWhitelist(
    job.serviceType,
    segment,
    job.bookingMatchMode,
  );
  let servicePass = true;
  if (
    enforceServiceWhitelist &&
    Array.isArray(allowed) &&
    allowed.length > 0 &&
    (!job.serviceType || !allowed.includes(job.serviceType))
  ) {
    servicePass = false;
  }
  checks.push({
    code: servicePass
      ? "SERVICE_TYPE_ALLOWED"
      : segment === "commercial"
        ? "COMMERCIAL_SERVICE_WHITELIST_REQUIRED"
        : "SERVICE_TYPE_NOT_IN_FO_ALLOWLIST",
    pass: servicePass,
    severity: "hard",
    detail: {
      serviceType: job.serviceType,
      matchableServiceTypes: allowed ?? null,
    },
  });
  if (!servicePass) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  let dailyOk = true;
  if (candidate.maxDailyLaborMinutes) {
    dailyOk =
      committed + job.estimatedLaborMinutes <= candidate.maxDailyLaborMinutes;
  }
  checks.push({
    code: dailyOk ? "DAILY_LABOR_UNDER_CAP" : "DAILY_LABOR_CAP_EXCEEDED",
    pass: dailyOk,
    severity: "hard",
    detail: {
      committedLaborMinutesToday: committed,
      requestedMinutes: job.estimatedLaborMinutes,
      cap: candidate.maxDailyLaborMinutes,
    },
  });
  if (!dailyOk) {
    return finalizeResult({
      candidate: placeholderCandidate,
      checks,
      advisory,
      mode,
    });
  }

  const assignedCrewSize = computeAssignedCrewSize({
    serviceType,
    serviceSegment: segment,
    normalizedRecommendedCrewSize: normRec,
    candidate: crew,
    workloadMinCrew,
  });

  const candidateMetrics: MatrixCandidateResult = {
    foId: candidate.foId,
    travelMinutesRounded: Math.round(travelMin),
    workloadMinCrew,
    assignedCrewSize: assignedCrewSize,
  };

  const flags = job.riskFlags?.filter((f) => String(f).trim() !== "") ?? [];
  if (flags.length > 0) {
    advisory.push({
      code: "RISK_FLAGS_PRESENT",
      pass: true,
      severity: "advisory",
      detail: { flags: [...flags] },
    });
    advisory.push({
      code: "MANUAL_REVIEW_SUGGESTED",
      pass: false,
      severity: "advisory",
    });
  }

  return finalizeResult({
    candidate: candidateMetrics,
    checks,
    advisory,
    mode,
  });
}

@Injectable()
export class ServiceMatrixEvaluator {
  evaluate(
    job: JobContext,
    candidate: MatrixCandidateInput,
    options?: MatrixEvaluateOptions,
  ): MatrixEvaluationResult {
    return evaluateServiceMatrixCandidate(job, candidate, options);
  }
}
