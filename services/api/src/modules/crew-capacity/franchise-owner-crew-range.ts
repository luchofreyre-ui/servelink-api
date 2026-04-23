import { clampCrewSizeToGlobalMax } from "./crew-capacity-policy";

export type ResolvedFranchiseOwnerCrewRange = {
  minCrewSize: number;
  preferredCrewSize: number;
  maxCrewSize: number;
};

type FoCrewSource = {
  teamSize: number | null;
  minCrewSize: number | null;
  preferredCrewSize: number | null;
  maxCrewSize: number | null;
};

/**
 * Derives min/preferred/max from legacy `teamSize` and optional explicit columns.
 * Never removes legacy `teamSize`; new columns override when present.
 */
export function resolveFranchiseOwnerCrewRange(fo: FoCrewSource): ResolvedFranchiseOwnerCrewRange {
  const hasExplicit =
    fo.minCrewSize != null ||
    fo.preferredCrewSize != null ||
    fo.maxCrewSize != null;

  const legacy =
    fo.teamSize != null && Number.isFinite(fo.teamSize) && fo.teamSize > 0
      ? Math.floor(fo.teamSize)
      : null;

  let minC: number;
  let pref: number;
  let maxC: number;

  if (hasExplicit) {
    const base = legacy ?? 1;
    minC = fo.minCrewSize ?? base;
    pref = fo.preferredCrewSize ?? fo.minCrewSize ?? base;
    maxC = fo.maxCrewSize ?? fo.preferredCrewSize ?? fo.minCrewSize ?? base;
  } else if (legacy != null) {
    /** Legacy `teamSize` is treated as max roster; FO can still run smaller crews. */
    minC = 1;
    pref = legacy;
    maxC = legacy;
  } else {
    minC = 1;
    pref = 1;
    maxC = 1;
  }

  minC = Math.max(1, Math.floor(minC));
  pref = Math.max(minC, Math.floor(pref));
  maxC = Math.max(pref, Math.floor(maxC));
  maxC = clampCrewSizeToGlobalMax(maxC);
  pref = Math.min(pref, maxC);
  pref = Math.max(pref, minC);

  return {
    minCrewSize: minC,
    preferredCrewSize: pref,
    maxCrewSize: maxC,
  };
}
