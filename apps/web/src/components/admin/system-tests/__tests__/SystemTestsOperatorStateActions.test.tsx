import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "test-token",
}));

vi.mock("@/lib/api/systemTestFamilyOperatorState", () => ({
  updateAdminSystemTestFamilyOperatorState: (...args: unknown[]) => updateMock(...args),
}));

import { SystemTestsOperatorStateActions } from "../SystemTestsOperatorStateActions";

describe("SystemTestsOperatorStateActions", () => {
  beforeEach(() => {
    updateMock.mockReset();
    updateMock.mockResolvedValue({
      state: "acknowledged",
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedByUserId: "u1",
      note: null,
    });
  });

  it("calls mutation on Acknowledge and invokes onUpdated", async () => {
    const onUpdated = vi.fn();
    const user = userEvent.setup();
    render(
      <SystemTestsOperatorStateActions
        familyId="fam-1"
        currentState="open"
        onUpdated={onUpdated}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^acknowledge$/i }));
    expect(updateMock).toHaveBeenCalledWith("test-token", "fam-1", { state: "acknowledged" });
    expect(onUpdated).toHaveBeenCalled();
  });

  it("shows Update failed on rejection", async () => {
    updateMock.mockRejectedValueOnce(new Error("nope"));
    const user = userEvent.setup();
    render(<SystemTestsOperatorStateActions familyId="fam-1" currentState="open" />);

    await user.click(screen.getByRole("button", { name: /^acknowledge$/i }));
    expect(await screen.findByText("Update failed")).toBeInTheDocument();
  });
});
