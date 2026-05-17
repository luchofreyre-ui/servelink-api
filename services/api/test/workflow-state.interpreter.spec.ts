import { interpretBookingOutboxForWorkflow } from "../src/modules/workflow/workflow-state.interpreter";
import { WORKFLOW_CONTRACT_VERSION } from "../src/modules/workflow/workflow.constants";

describe("interpretBookingOutboxForWorkflow", () => {
  it("flags payment lane for PAYMENT event types", () => {
    const r = interpretBookingOutboxForWorkflow({
      aggregateType: "booking",
      aggregateId: "b1",
      correlationId: "c1",
      eventType: "PAYMENT_STATUS_UPDATE",
      dedupeKey: "k1",
      lifecycleCategory: "payment",
      operationalEventCategory: "payment",
    });
    expect(r.contractVersion).toBe(WORKFLOW_CONTRACT_VERSION);
    expect(r.operationalSignals.paymentLane).toBe(true);
    expect(r.operationalSignals.assignmentLane).toBe(false);
  });

  it("flags assignment lane from operational category", () => {
    const r = interpretBookingOutboxForWorkflow({
      aggregateType: "booking",
      aggregateId: "b1",
      correlationId: "c1",
      eventType: "BOOKING_ASSIGN",
      dedupeKey: null,
      lifecycleCategory: "assignment",
      operationalEventCategory: "assignment",
    });
    expect(r.operationalSignals.assignmentLane).toBe(true);
  });
});
