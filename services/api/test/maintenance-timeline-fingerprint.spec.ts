import {
  computeCheckpointInputFingerprint,
  fingerprintMaintenanceEvolutionInput,
  stableJsonStringify,
} from "../src/estimating/maintenance-timeline/maintenance-timeline-fingerprint";
import { weeklyStableHome } from "../src/estimating/maintenance-state/maintenance-state-fixtures";

describe("maintenance timeline fingerprinting", () => {
  it("stableJsonStringify sorts keys deterministically", () => {
    expect(stableJsonStringify({ b: 1, a: 2 })).toBe(stableJsonStringify({ a: 2, b: 1 }));
  });

  it("fingerprintMaintenanceEvolutionInput is stable for same logical input", () => {
    const a = weeklyStableHome();
    const b = weeklyStableHome();
    expect(fingerprintMaintenanceEvolutionInput(a)).toBe(
      fingerprintMaintenanceEvolutionInput(b),
    );
  });

  it("checkpoint input fingerprint ignores volatile DB-only fields like createdAt", () => {
    const input = weeklyStableHome();
    const fp1 = computeCheckpointInputFingerprint({
      subjectType: "booking",
      subjectId: "bk_1",
      effectiveAtIso: "2026-01-01T00:00:00.000Z",
      sourceKind: "replay_job",
      evolutionInput: input,
    });
    const fp2 = computeCheckpointInputFingerprint({
      subjectType: "booking",
      subjectId: "bk_1",
      effectiveAtIso: "2026-01-01T00:00:00.000Z",
      sourceKind: "replay_job",
      evolutionInput: input,
    });
    expect(fp1).toBe(fp2);
    expect(fp1.length).toBeGreaterThan(4);
  });

  it("changes effectiveAt changes checkpoint input fingerprint", () => {
    const input = weeklyStableHome();
    const fp1 = computeCheckpointInputFingerprint({
      subjectType: "customer",
      subjectId: "c1",
      effectiveAtIso: "2026-01-01T00:00:00.000Z",
      sourceKind: "replay_job",
      evolutionInput: input,
    });
    const fp2 = computeCheckpointInputFingerprint({
      subjectType: "customer",
      subjectId: "c1",
      effectiveAtIso: "2026-02-01T00:00:00.000Z",
      sourceKind: "replay_job",
      evolutionInput: input,
    });
    expect(fp1).not.toBe(fp2);
  });
});
