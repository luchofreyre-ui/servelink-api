import { describe, expect, it } from "vitest";
import type { DeepCleanEstimatorVersionHistoryRowApi } from "@/types/deepCleanEstimatorGovernance";
import {
  getActiveVersion,
  getArchivedVersions,
  getDraftVersion,
  getLatestPublishedVersion,
  getRollbackReadyCandidates,
} from "./deepCleanEstimatorGovernanceSelectors";

function row(
  partial: Partial<DeepCleanEstimatorVersionHistoryRowApi>,
): DeepCleanEstimatorVersionHistoryRowApi {
  return {
    id: "id",
    version: 1,
    status: "active",
    label: "L",
    publishedAt: null,
    createdAt: "",
    updatedAt: "",
    createdByUserId: null,
    publishedByUserId: null,
    ...partial,
  };
}

describe("deepCleanEstimatorGovernanceSelectors", () => {
  it("splits active, draft, archived and rollback candidates", () => {
    const rows = [
      row({ id: "a", version: 3, status: "active" }),
      row({ id: "d", version: 4, status: "draft" }),
      row({ id: "x", version: 2, status: "archived" }),
    ];
    expect(getActiveVersion(rows)?.id).toBe("a");
    expect(getDraftVersion(rows)?.id).toBe("d");
    expect(getArchivedVersions(rows)).toHaveLength(1);
    const candidates = getRollbackReadyCandidates(rows);
    expect(candidates.map((c) => c.id).sort()).toEqual(["a", "x"]);
  });

  it("getLatestPublishedVersion picks highest version among active+archived", () => {
    const rows = [
      row({ version: 1, status: "archived" }),
      row({ version: 5, status: "active" }),
      row({ version: 6, status: "draft" }),
    ];
    expect(getLatestPublishedVersion(rows)?.version).toBe(5);
  });
});
