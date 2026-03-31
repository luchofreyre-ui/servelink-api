import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchIncidentsList = vi.fn().mockResolvedValue([]);
const fetchActions = vi.fn().mockResolvedValue({ items: [] });

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "test-token",
}));

vi.mock("@/lib/api/systemTestIncidents", () => ({
  fetchAdminSystemTestIncidents: (...args: unknown[]) => fetchIncidentsList(...args),
}));

vi.mock("@/lib/api/systemTestIncidentActions", () => ({
  fetchSystemTestIncidentActions: (...args: unknown[]) => fetchActions(...args),
}));

import AdminSystemTestIncidentsPage from "../page";

describe("AdminSystemTestIncidentsPage run incidents tab", () => {
  beforeEach(() => {
    fetchIncidentsList.mockClear();
    fetchActions.mockClear();
    fetchIncidentsList.mockResolvedValue([]);
    fetchActions.mockResolvedValue({ items: [] });
  });

  it("loads run incidents with query params when Run incidents tab is selected", async () => {
    const user = userEvent.setup();
    render(<AdminSystemTestIncidentsPage />);

    await waitFor(() => expect(fetchActions).toHaveBeenCalled());

    await user.click(screen.getByTestId("incidents-tab-run"));

    await waitFor(() => {
      expect(fetchIncidentsList).toHaveBeenCalled();
    });

    const last = fetchIncidentsList.mock.calls[fetchIncidentsList.mock.calls.length - 1];
    expect(last[0]).toBe("test-token");
    expect(last[1]).toMatchObject({
      limit: 120,
      sortBy: "recent",
      sortDirection: "desc",
    });
  });
});
