export type ConsistencyState =
  | "aligned"
  | "under_responded"
  | "over_responded"
  | "missing_owner_action"
  | "acceptable_variant";

export type DecisionConsistencyFinding = {
  bookingId: string;
  standardId: string;
  standardTitle: string;
  currentDecisionPath: string;
  consistencyState: ConsistencyState;
  deviationReason: string;
  suggestedCorrection: string;
};
