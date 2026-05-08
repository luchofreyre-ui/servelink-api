import type {
  BuildServiceMatrixShadowPayloadInput,
  ServiceMatrixShadowDecisionDiff,
  ServiceMatrixShadowPayload,
  ServiceMatrixShadowReasonCodeDiff,
} from "./service-matrix.types";

function stableSortStrings(ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function uniqueSortedCodes(codes: readonly string[] | undefined): string[] {
  const raw = codes ?? [];
  const seen = new Set<string>();
  for (const c of raw) {
    const t = String(c).trim();
    if (t) seen.add(t);
  }
  return stableSortStrings([...seen]);
}

function codesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function setDifferenceSorted(
  minuend: readonly string[],
  subtrahend: readonly string[],
): string[] {
  const sub = new Set(subtrahend);
  return stableSortStrings(minuend.filter((id) => !sub.has(id)));
}

/**
 * Pure shadow diff payload for S2. No I/O, no mutation of `input`.
 * `jobContextHash` must be supplied by the caller (redacted / canonical input only).
 */
export function buildServiceMatrixShadowPayload(
  input: BuildServiceMatrixShadowPayloadInput,
): ServiceMatrixShadowPayload {
  const legacyCandidateIds = stableSortStrings(input.legacyCandidateIds);
  const matrixCandidateIds = stableSortStrings(input.matrixCandidateIds);
  const addedByMatrix = setDifferenceSorted(matrixCandidateIds, legacyCandidateIds);
  const removedByMatrix = setDifferenceSorted(legacyCandidateIds, matrixCandidateIds);

  const candidateKeys = stableSortStrings(Object.keys(input.perCandidate));

  const decisionDiffs: ServiceMatrixShadowDecisionDiff[] = [];
  const reasonCodeDiffs: ServiceMatrixShadowReasonCodeDiff[] = [];

  for (const foId of candidateKeys) {
    const row = input.perCandidate[foId];
    if (!row) continue;

    if (row.legacyEligible !== row.matrixEligible) {
      decisionDiffs.push({
        foId,
        legacyEligible: row.legacyEligible,
        matrixEligible: row.matrixEligible,
      });
    }

    const legacyCodes = uniqueSortedCodes(row.legacyPrimaryReasonCodes);
    const matrixCodes = uniqueSortedCodes(row.matrixPrimaryReasonCodes);
    if (!codesEqual(legacyCodes, matrixCodes)) {
      reasonCodeDiffs.push({
        foId,
        legacyPrimaryReasonCodes: [...legacyCodes],
        matrixPrimaryReasonCodes: [...matrixCodes],
      });
    }
  }

  return {
    requestId: input.requestId,
    sourceSurface: input.sourceSurface,
    evaluatedAt:
      input.evaluatedAt !== undefined && input.evaluatedAt !== ""
        ? input.evaluatedAt
        : new Date().toISOString(),
    jobContextHash: input.jobContextHash,
    legacyCandidateIds,
    matrixCandidateIds,
    addedByMatrix,
    removedByMatrix,
    decisionDiffs,
    reasonCodeDiffs,
    durationInputSummary: { ...input.durationInputSummary },
    capacityInputSummary: { ...input.capacityInputSummary },
    geographyInputSummary: { ...input.geographyInputSummary },
    safeRedactions: [...input.safeRedactions],
  };
}
