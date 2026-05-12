import { WORKFLOW_CONTRACT_VERSION } from "./workflow.constants";

export type WorkflowInterpretationPayload = {
  contractVersion: typeof WORKFLOW_CONTRACT_VERSION;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  outboxEventType: string;
  outboxDedupeKey: string | null;
  lifecycleCategory: string | null;
  operationalEventCategory: string | null;
  operationalSignals: {
    paymentLane: boolean;
    lifecycleLane: boolean;
    assignmentLane: boolean;
  };
};

/**
 * Read-only interpretation for durable workflow payloadJson — deterministic, replay-stable inputs only.
 */
export function interpretBookingOutboxForWorkflow(input: {
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  eventType: string;
  dedupeKey: string | null;
  lifecycleCategory: string | null;
  operationalEventCategory: string | null;
}): WorkflowInterpretationPayload {
  const opCat = input.operationalEventCategory ?? "";
  const lc = input.lifecycleCategory ?? "";
  const et = input.eventType ?? "";

  return {
    contractVersion: WORKFLOW_CONTRACT_VERSION,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    correlationId: input.correlationId,
    outboxEventType: et,
    outboxDedupeKey: input.dedupeKey,
    lifecycleCategory: input.lifecycleCategory,
    operationalEventCategory: input.operationalEventCategory,
    operationalSignals: {
      paymentLane:
        opCat === "payment" || lc === "payment" || et.includes("PAYMENT"),
      lifecycleLane:
        lc === "lifecycle_main" ||
        lc === "lifecycle_segment" ||
        opCat === "lifecycle",
      assignmentLane: opCat === "assignment" || et.includes("ASSIGN"),
    },
  };
}
