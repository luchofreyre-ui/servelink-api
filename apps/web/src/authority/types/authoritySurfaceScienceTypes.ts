export type SurfaceMaterialFamily =
  | "glass"
  | "stone"
  | "ceramic"
  | "metal"
  | "wood"
  | "polymer"
  | "composite"
  | "painted";

export type SurfaceFinishFamily =
  | "polished"
  | "honed"
  | "matte"
  | "gloss"
  | "sealed"
  | "unsealed"
  | "coated"
  | "unfinished";

export type SurfacePorosityLevel = "non-porous" | "low" | "moderate" | "high";

export type SurfaceToleranceLevel = "low" | "moderate" | "high";

export type SurfaceCoatingSealerState =
  | "not-applicable"
  | "possible"
  | "sealed"
  | "coated"
  | "finish-dependent"
  | "unknown-risk";

export interface AuthoritySurfaceScienceProfile {
  material: {
    family: SurfaceMaterialFamily;
    identity: string;
    behavior: string;
  };
  finish: {
    families: SurfaceFinishFamily[];
    identity: string;
    behavior: string;
  };
  porosity: {
    level: SurfacePorosityLevel;
    behavior: string;
    absorptionRisk: string;
  };
  moistureTolerance: {
    level: SurfaceToleranceLevel;
    risks: string[];
    controlStrategy: string;
  };
  abrasionTolerance: {
    level: SurfaceToleranceLevel;
    risks: string[];
    controlStrategy: string;
  };
  chemicalSensitivity: {
    level: SurfaceToleranceLevel;
    sensitiveTo: string[];
    controlStrategy: string;
  };
  coatingSealer: {
    state: SurfaceCoatingSealerState;
    risks: string[];
    controlStrategy: string;
  };
  restorationBoundary: {
    restorableConditions: string[];
    limits: string[];
    escalationSignals: string[];
  };
  prevention: {
    strategies: string[];
    inspectionCues: string[];
  };
}
