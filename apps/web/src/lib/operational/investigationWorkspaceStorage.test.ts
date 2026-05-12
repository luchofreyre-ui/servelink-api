import { describe, expect, it } from "vitest";
import {
  INVESTIGATION_WORKSPACE_ENGINE_VERSION,
  mergeImportedWorkspaces,
  newInvestigationWorkspace,
  parseWorkspaceImportEnvelope,
  buildWorkspaceExportEnvelope,
} from "./investigationWorkspaceStorage";

describe("investigationWorkspaceStorage", () => {
  it("round-trips export envelope parsing", () => {
    const ws = newInvestigationWorkspace("Test");
    const env = buildWorkspaceExportEnvelope([ws]);
    const raw = JSON.stringify(env);
    const parsed = parseWorkspaceImportEnvelope(raw);
    expect(parsed?.workspaces[0]?.title).toBe("Test");
    expect(parsed?.workspaces[0]?.workspaceEngineVersion).toBe(
      INVESTIGATION_WORKSPACE_ENGINE_VERSION,
    );
  });

  it("mergeImportedWorkspaces rewrites ids on collision", () => {
    const a = newInvestigationWorkspace("A");
    const b = { ...newInvestigationWorkspace("B"), id: a.id };
    const merged = mergeImportedWorkspaces([a], [b]);
    expect(merged.length).toBe(2);
    expect(new Set(merged.map((w) => w.id)).size).toBe(2);
  });
});
