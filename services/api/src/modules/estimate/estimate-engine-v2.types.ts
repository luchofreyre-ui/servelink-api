export type EstimateRiskLevel = "low" | "medium" | "high";

export type EstimateV2SnapshotVersion = "estimate_engine_v2_core_v1";

export type EstimateReconciliationClassification =
  | "aligned"
  | "v2_higher"
  | "v2_lower";

export interface EstimateV2VarianceRange {
  lowMinutes: number;
  highMinutes: number;
}

export interface EstimateV2PricingFactors {
  baseMinutes: number;
  squareFootageMinutes: number;
  bedroomMinutes: number;
  bathroomMinutes: number;
  serviceAddMinutes: number;
  conditionScore: number;
  conditionMultiplier: number;
  serviceMaxConditionMultiplier: number;
  serviceAbsoluteMaxMinutes: number;
  sqftBandMaxMinutesCap: number;
  appliedExpectedMinutesCap: number;
  confidencePenaltyMultiplier: number;
}

export interface EstimateV2Output {
  snapshotVersion: EstimateV2SnapshotVersion;

  expectedMinutes: number;

  bufferMinutes: number;
  bufferPercent: number;

  pricedMinutes: number;

  confidenceScore: number;
  riskLevel: EstimateRiskLevel;

  varianceRange: EstimateV2VarianceRange;
  pricingFactors: EstimateV2PricingFactors;
  riskFlags: string[];
  explanation: string;

  adminOnly: {
    expectedMinutes: number;
    bufferMinutes: number;
    pricedMinutes: number;
    bufferPolicy: string;
    bufferReasonCodes: string[];
  };

  foVisible: {
    targetMinutes: number;
    riskFlags: string[];
  };

  customerVisible: {
    estimatedMinutes: number;
    estimatedPrice?: number;
    explanation: string;
  };
}

export interface EstimateV2Reconciliation {
  v1Minutes: number;
  v1PriceCents: number;

  v2ExpectedMinutes: number;
  v2PricedMinutes: number;
  v2PriceCents: number;

  expectedDeltaMinutes: number;
  pricedDeltaMinutes: number;
  expectedDeltaPercent: number;
  pricedDeltaPercent: number;
  priceDeltaCents: number;
  priceDeltaPercent: number;

  classification: EstimateReconciliationClassification;

  authority: {
    pricingAuthority: "legacy_v1";
    durationAuthority: "legacy_v1";
    v2Mode: "shadow";
  };

  flags: string[];
}
