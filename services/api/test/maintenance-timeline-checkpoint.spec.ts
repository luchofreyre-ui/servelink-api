import { evaluateMaintenanceStateEvolution } from "../src/estimating/maintenance-state/maintenance-state-evolution";
import { weeklyStableHome } from "../src/estimating/maintenance-state/maintenance-state-fixtures";
import {
  compactMaintenanceEvolutionForCheckpointPayload,
  computeOutputFingerprintFromEvolution,
} from "../src/estimating/maintenance-timeline/maintenance-timeline-checkpoint";
import { MaintenanceTimelineService } from "../src/modules/maintenance-timeline/maintenance-timeline.service";

describe("maintenance timeline checkpoint payload builder", () => {
  it("stores compact evolution output without raw booking snapshot duplication", () => {
    const evolution = evaluateMaintenanceStateEvolution(weeklyStableHome());
    const compact = compactMaintenanceEvolutionForCheckpointPayload(evolution);
    expect(Object.keys(compact)).toEqual(
      expect.arrayContaining([
        "payloadSchema",
        "currentState",
        "projectedState",
        "transitionSummary",
      ]),
    );
    expect(JSON.stringify(compact)).not.toMatch(/rawNormalizedIntake/);
    expect(JSON.stringify(compact)).not.toMatch(/BookingEstimateSnapshot/);
    expect(computeOutputFingerprintFromEvolution(evolution)).toEqual(
      computeOutputFingerprintFromEvolution(evolution),
    );
  });

  it("preserves provenance on create payload while fingerprints stay deterministic", () => {
    const prismaStub = {} as never;
    const svc = new MaintenanceTimelineService(prismaStub);
    const evolution = evaluateMaintenanceStateEvolution(weeklyStableHome());
    const evolutionInput = weeklyStableHome();
    const payload = svc.buildCheckpointCreatePayload({
      subjectType: "booking",
      subjectId: "bk_fixture",
      customerId: "cust_fixture",
      bookingId: "bk_fixture",
      effectiveAt: new Date("2026-03-01T12:00:00.000Z"),
      sourceKind: "replay_job",
      evolutionInput,
      evolutionResult: evolution,
      provenance: {
        replayApiVersion: "t",
        bookingId: "bk_fixture",
        actorUserId: "admin_fixture",
      },
    });
    expect(payload.provenance).toBeTruthy();
    expect(typeof payload.inputFingerprint).toBe("string");
    expect(typeof payload.outputFingerprint).toBe("string");
  });
});
