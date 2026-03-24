import { DEEP_CLEAN_BUNDLE_IDS } from "../src/modules/scope/task-bundles";
import {
  buildVisitScopeDisplay,
  labelsForTaskIds,
  taskIdsFromBundles,
} from "../src/modules/scope/scope-helpers";

describe("scope helpers", () => {
  it("resolves foundation bundle task ids", () => {
    const ids = taskIdsFromBundles([DEEP_CLEAN_BUNDLE_IDS.FOUNDATION]);
    expect(ids).toHaveLength(4);
    expect(ids[0]).toBe("dcc_t_surface_reset");
    const labels = labelsForTaskIds(ids);
    expect(labels[0]).toMatch(/Surface reset/);
  });

  it("buildVisitScopeDisplay merges bundle and task copy", () => {
    const d = buildVisitScopeDisplay({
      taskBundleIds: [DEEP_CLEAN_BUNDLE_IDS.DETAIL_BUNDLE_A],
      taskIds: taskIdsFromBundles([DEEP_CLEAN_BUNDLE_IDS.DETAIL_BUNDLE_A]),
    });
    expect(d.headline).toMatch(/detail bundle A/i);
    expect(d.taskLabels.length).toBeGreaterThan(0);
  });
});
