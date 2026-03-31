import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchFamilies = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "test-token",
}));

vi.mock("@/lib/api/systemTestFamilies", () => ({
  fetchAdminSystemTestFamilies: (...args: unknown[]) => fetchFamilies(...args),
}));

import AdminSystemTestFamiliesPage from "../page";

describe("AdminSystemTestFamiliesPage resolution filters", () => {
  beforeEach(() => {
    fetchFamilies.mockClear();
    fetchFamilies.mockResolvedValue([]);
  });

  it("passes diagnosisCategory and sort params to fetch when filters change", async () => {
    const user = userEvent.setup();
    render(<AdminSystemTestFamiliesPage />);

    await waitFor(() => {
      expect(fetchFamilies).toHaveBeenCalled();
    });

    const firstCall = fetchFamilies.mock.calls[0];
    expect(firstCall[0]).toBe("test-token");
    expect(firstCall[1]).toMatchObject({ limit: 80, sortBy: "recent", sortDirection: "desc" });

    await user.selectOptions(screen.getByTestId("system-tests-filter-category"), "timing_issue");
    await user.selectOptions(screen.getByTestId("system-tests-filter-sort"), "confidence:desc");

    await waitFor(() => {
      const calls = fetchFamilies.mock.calls;
      const last = calls[calls.length - 1];
      expect(last[1]).toMatchObject({
        diagnosisCategory: "timing_issue",
        sortBy: "confidence",
        sortDirection: "desc",
      });
    });
  });

  it("passes showDismissed when toggle is enabled", async () => {
    const user = userEvent.setup();
    render(<AdminSystemTestFamiliesPage />);

    await waitFor(() => {
      expect(fetchFamilies).toHaveBeenCalled();
    });

    await user.click(screen.getByTestId("families-show-dismissed-toggle"));

    await waitFor(() => {
      const last = fetchFamilies.mock.calls[fetchFamilies.mock.calls.length - 1];
      expect(last[1]).toMatchObject({ showDismissed: true });
    });
  });
});
