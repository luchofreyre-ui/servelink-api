/**
 * Deterministic problem/method × surface compatibility for encyclopedia expansion.
 * Applied in expanded-index generation and cluster gap backfill (same rules).
 */

export type SurfaceCompatibilityReason =
  | "COMPATIBLE"
  | "MATERIAL_TO_MATERIAL_MISMATCH"
  | "SURFACE_SPECIFIC_FAMILY_MISMATCH"
  | "GLASS_CARE_SURFACE_MISMATCH"
  | "MINERAL_FAMILY_SURFACE_MISMATCH"
  | "INCOMPATIBLE_SURFACE_COMBINATION";

export type SurfaceCompatibilityResult = {
  ok: boolean;
  reason: SurfaceCompatibilityReason;
};

/** Broad cleaning families — keep combinatorially broad. */
const BROAD_CLEANING_FAMILIES = new Set<string>([
  "degreasing",
  "dust-removal",
  "dust-buildup",
  "neutral-surface-cleaning",
  "neutral-cleaning",
  "touchpoint-sanitization",
  "sanitization",
  "general-soil",
  "grease-buildup",
  "stuck-on-residue",
]);

const SHOWER_GLASS_FAMILY = "shower-glass";

const SHOWER_GLASS_ALLOWED_SURFACES = new Set<string>([
  "shower-glass",
  "glass",
  "shower-walls",
  "bathroom-fixtures",
]);

/** Glass-focused method/problem families — only sensible on clear glass contexts. */
const GLASS_CARE_FAMILY_SLUGS = new Set<string>(["glass-cleaning", "glass-etching", "streak-free-glass-cleaning"]);

const GLASS_CARE_ALLOWED_SURFACES = new Set<string>(["glass", "shower-glass"]);

const MINERAL_FAMILY_SLUGS = new Set<string>([
  "hard-water",
  "hard-water-removal",
  "hard-water-deposits",
  "limescale",
  "soap-scum",
  "soap-scum-removal",
  "product-residue",
]);

/** Conservative allowlist for mineral / residue families. */
const MINERAL_ALLOWED_SURFACES = new Set<string>([
  "glass",
  "glass-surfaces",
  "shower-glass",
  "tile",
  "grout",
  "bathroom-fixtures",
  "shower-walls",
  "backsplashes",
  "countertops",
  "tile-floors",
  "stainless-steel",
  "floors",
]);

/** Problem/method slug is primarily a substrate identity (material-on-material weak pages). */
const IDENTITY_SUBSTRATE_SLUGS = new Set<string>(["glass", "tile", "stainless-steel", "finished-wood", "grout"]);

function identityMaterialBlockedSurfaces(familySlug: string): Set<string> | null {
  if (familySlug === "glass" || familySlug === "tile" || familySlug === "stainless-steel") {
    return new Set(["laminate", "vinyl", "painted-walls"]);
  }
  if (familySlug === "finished-wood") {
    return new Set(["laminate", "vinyl", "painted-walls"]);
  }
  if (familySlug === "grout") {
    return new Set(["laminate", "vinyl", "painted-walls", "cabinets"]);
  }
  return null;
}

function evaluateFamilySurface(familySlug: string, normalizedSurfaceSlug: string): SurfaceCompatibilityResult {
  if (BROAD_CLEANING_FAMILIES.has(familySlug)) {
    return { ok: true, reason: "COMPATIBLE" };
  }

  if (familySlug === SHOWER_GLASS_FAMILY) {
    if (SHOWER_GLASS_ALLOWED_SURFACES.has(normalizedSurfaceSlug)) {
      return { ok: true, reason: "COMPATIBLE" };
    }
    return { ok: false, reason: "SURFACE_SPECIFIC_FAMILY_MISMATCH" };
  }

  if (GLASS_CARE_FAMILY_SLUGS.has(familySlug)) {
    if (GLASS_CARE_ALLOWED_SURFACES.has(normalizedSurfaceSlug)) {
      return { ok: true, reason: "COMPATIBLE" };
    }
    return { ok: false, reason: "GLASS_CARE_SURFACE_MISMATCH" };
  }

  if (MINERAL_FAMILY_SLUGS.has(familySlug)) {
    if (MINERAL_ALLOWED_SURFACES.has(normalizedSurfaceSlug)) {
      return { ok: true, reason: "COMPATIBLE" };
    }
    return { ok: false, reason: "MINERAL_FAMILY_SURFACE_MISMATCH" };
  }

  if (IDENTITY_SUBSTRATE_SLUGS.has(familySlug)) {
    const blocked = identityMaterialBlockedSurfaces(familySlug);
    if (blocked?.has(normalizedSurfaceSlug)) {
      return { ok: false, reason: "MATERIAL_TO_MATERIAL_MISMATCH" };
    }
  }

  /** Laminate is only combined with broad cleaning families; avoids weak pages for narrow/mineral/glass topics. */
  if (normalizedSurfaceSlug === "laminate" && !BROAD_CLEANING_FAMILIES.has(familySlug)) {
    return { ok: false, reason: "INCOMPATIBLE_SURFACE_COMBINATION" };
  }

  return { ok: true, reason: "COMPATIBLE" };
}

export function evaluateProblemSurfaceCompatibility(
  problemSlug: string,
  normalizedSurfaceSlug: string,
): SurfaceCompatibilityResult {
  return evaluateFamilySurface(problemSlug, normalizedSurfaceSlug);
}

export function evaluateMethodSurfaceCompatibility(
  methodSlug: string,
  normalizedSurfaceSlug: string,
): SurfaceCompatibilityResult {
  return evaluateFamilySurface(methodSlug, normalizedSurfaceSlug);
}

export function isCompatibleProblemSurface(problemSlug: string, normalizedSurfaceSlug: string): boolean {
  return evaluateProblemSurfaceCompatibility(problemSlug, normalizedSurfaceSlug).ok;
}

export function isCompatibleMethodSurface(methodSlug: string, normalizedSurfaceSlug: string): boolean {
  return evaluateMethodSurfaceCompatibility(methodSlug, normalizedSurfaceSlug).ok;
}

/** Glass-like normalized slugs from taxonomy cleanup (e.g. shower-glass → glass-surfaces). */
const GLASS_LIKE_SURFACES = new Set<string>(["glass", "glass-surfaces", "shower-glass"]);

export type ToolMethodSurfaceCompatibilityReason = "COMPATIBLE" | "TOOL_SURFACE_MISMATCH";

export type ToolMethodSurfaceCompatibilityResult = {
  ok: boolean;
  reason: ToolMethodSurfaceCompatibilityReason;
};

const SQUEEGEE_ALLOWED = new Set<string>([
  ...GLASS_LIKE_SURFACES,
  "shower-walls",
  "bathroom-fixtures",
]);

const MOP_ALLOWED = new Set<string>(["floors", "tile-floors", "vinyl", "laminate"]);

const SOFT_BRISTLE_ALLOWED = new Set<string>([
  "grout",
  "tile-floors",
  "backsplashes",
  "bathroom-fixtures",
  "shower-walls",
]);

const SCRUB_PAD_ALLOWED = new Set<string>([
  "backsplashes",
  "bathroom-fixtures",
  "tile-floors",
  "grout",
  "stainless-steel",
]);

const SPONGE_ALLOWED = new Set<string>([
  "countertops",
  "backsplashes",
  "bathroom-fixtures",
  "cabinets",
  "shower-walls",
  "tile-floors",
  "grout",
]);

const MICROFIBER_BLOCKED = new Set<string>(["floors", "tile-floors"]);

function toolSurfaceAllowed(toolSlug: string, normalizedSurfaceSlug: string): boolean {
  switch (toolSlug) {
    case "squeegee":
      return SQUEEGEE_ALLOWED.has(normalizedSurfaceSlug);
    case "mop":
      return MOP_ALLOWED.has(normalizedSurfaceSlug);
    case "soft-bristle-brush":
      return SOFT_BRISTLE_ALLOWED.has(normalizedSurfaceSlug);
    case "scrub-pad":
      return SCRUB_PAD_ALLOWED.has(normalizedSurfaceSlug);
    case "microfiber-cloth":
      return !MICROFIBER_BLOCKED.has(normalizedSurfaceSlug);
    case "sponge":
      return SPONGE_ALLOWED.has(normalizedSurfaceSlug);
    default:
      return false;
  }
}

/**
 * Tool × surface guard for expanded method_surface_tool rows.
 * Call only after method × surface compatibility already passes.
 * `methodSlug` is reserved for future method-specific tool rules; v1 rules are tool × surface only.
 */
export function evaluateToolMethodSurfaceCompatibility(
  toolSlug: string,
  _methodSlug: string,
  normalizedSurfaceSlug: string,
): ToolMethodSurfaceCompatibilityResult {
  if (toolSurfaceAllowed(toolSlug, normalizedSurfaceSlug)) {
    return { ok: true, reason: "COMPATIBLE" };
  }
  return { ok: false, reason: "TOOL_SURFACE_MISMATCH" };
}

export function isCompatibleToolMethodSurface(
  toolSlug: string,
  methodSlug: string,
  normalizedSurfaceSlug: string,
): boolean {
  return evaluateToolMethodSurfaceCompatibility(toolSlug, methodSlug, normalizedSurfaceSlug).ok;
}
