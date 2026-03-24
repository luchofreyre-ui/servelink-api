/**
 * Static metadata for the bundled authority graph (`AUTHORITY_SNAPSHOT`).
 * Used by snapshot-metadata API until a unified external source exists.
 */
export const AUTHORITY_SNAPSHOT_METADATA = {
  /** Monotonic / semver-style marker; bump when the bundled graph changes. */
  version: "1",
  /** Identifies how the snapshot is distributed (API codebase bundle). */
  source: "api_bundle:authority.snapshot",
} as const;

export interface AuthoritySnapshot {
  methods: string[];
  surfaces: string[];
  problems: string[];
  methodToSurfaces: Record<string, string[]>;
  methodToProblems: Record<string, string[]>;
  surfaceToProblems: Record<string, string[]>;
}

export const AUTHORITY_SNAPSHOT: AuthoritySnapshot = {
  methods: [
    "neutral-surface-cleaning",
    "degreasing",
    "hard-water-deposit-removal",
    "touchpoint-sanitization",
    "glass-cleaning",
  ],

  surfaces: [
    "tile",
    "vinyl-flooring",
    "painted-walls",
    "stainless-steel",
    "shower-glass",
    "granite-countertops",
  ],

  problems: [
    "grease-buildup",
    "stuck-on-residue",
    "hard-water-deposits",
    "limescale",
    "soap-scum",
    "touchpoint-contamination",
    "dust-buildup",
    "light-mildew",
    "general-soil",
    "smudging",
  ],

  methodToSurfaces: {
    "neutral-surface-cleaning": ["tile", "vinyl-flooring", "painted-walls", "granite-countertops"],
    "degreasing": ["tile", "stainless-steel"],
    "hard-water-deposit-removal": ["shower-glass", "stainless-steel", "granite-countertops"],
    "touchpoint-sanitization": ["tile", "painted-walls", "stainless-steel"],
    "glass-cleaning": ["shower-glass"],
  },

  methodToProblems: {
    "neutral-surface-cleaning": ["dust-buildup", "general-soil", "smudging"],
    "degreasing": ["grease-buildup", "stuck-on-residue"],
    "hard-water-deposit-removal": ["hard-water-deposits", "limescale", "soap-scum"],
    "touchpoint-sanitization": ["touchpoint-contamination"],
    "glass-cleaning": ["smudging", "soap-scum"],
  },

  surfaceToProblems: {
    "tile": ["grease-buildup", "soap-scum", "general-soil", "light-mildew"],
    "vinyl-flooring": ["dust-buildup", "general-soil"],
    "painted-walls": ["touchpoint-contamination", "smudging", "general-soil"],
    "stainless-steel": ["hard-water-deposits", "smudging", "grease-buildup"],
    "shower-glass": ["hard-water-deposits", "limescale", "soap-scum", "smudging"],
    "granite-countertops": ["hard-water-deposits", "smudging", "general-soil"],
  },
};
