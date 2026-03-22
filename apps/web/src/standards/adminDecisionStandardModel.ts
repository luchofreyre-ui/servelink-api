export type EscalationLevel = "L1" | "L2" | "L3";

export type AdminDecisionStandard = {
  id: string;
  title: string;
  scenarioSignature: string;
  recommendedDecisionPath: string;
  expectedOwnershipPosture: string;
  followUpExpectation: string;
  escalationLevel: EscalationLevel;
  whenDeviationAcceptable: string;
};
