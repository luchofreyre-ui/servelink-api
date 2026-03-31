import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SystemTestsListResolutionFilters } from "../SystemTestsListResolutionFilters";

describe("SystemTestsListResolutionFilters", () => {
  it("renders controls and forwards category changes", async () => {
    const user = userEvent.setup();
    const onCategory = vi.fn();
    const onConfidence = vi.fn();
    const onSort = vi.fn();

    render(
      <SystemTestsListResolutionFilters
        sortOptions={[{ value: "recent:desc", label: "Most recent" }]}
        category=""
        confidenceTier=""
        sortCombo="recent:desc"
        onCategoryChange={onCategory}
        onConfidenceChange={onConfidence}
        onSortComboChange={onSort}
      />,
    );

    expect(screen.getByTestId("system-tests-filter-category")).toBeInTheDocument();
    await user.selectOptions(screen.getByTestId("system-tests-filter-category"), "auth_state");
    expect(onCategory).toHaveBeenCalledWith("auth_state");
  });
});
