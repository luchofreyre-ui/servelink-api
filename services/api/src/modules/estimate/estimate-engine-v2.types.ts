export type EstimateRiskLevel = "low" | "medium" | "high";

export type EstimateV2SnapshotVersion = "estimate_engine_v2_core_v1";

export interface EstimateV2VarianceRange {
  lowMinutes: number;
  highMinutes: number;
}

export interface EstimateV2PricingFactors {
  baseMinutes: number;
  squareFootageMinutes: number;
  bedroomMinutes: number;
  bathroomMinutes: number;
  serviceTypeMultiplier: number;
  laborConditionMultiplier: number;
  clutterAccessMultiplier: number;
  kitchenIntensityMultiplier: number;
  petMultiplier: number;
  recencyMultiplier: number;
  expectationMultiplier: number;
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
