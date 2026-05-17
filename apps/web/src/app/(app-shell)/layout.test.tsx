import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShellLayout from "./layout";

const mockUsePathname = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("AppShellLayout", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/customer/auth");
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("keeps pre-auth navigation focused on sign-in paths", () => {
    render(
      <AppShellLayout>
        <main>Auth content</main>
      </AppShellLayout>,
    );

    expect(screen.getByText("Customer sign in")).toHaveAttribute(
      "href",
      "/customer/auth",
    );
    expect(screen.getByText("Partner sign in")).toHaveAttribute(
      "href",
      "/fo/auth",
    );
    expect(screen.getByText("Admin sign in")).toHaveAttribute(
      "href",
      "/admin/auth",
    );
    expect(screen.queryByText("Ops")).toBeNull();
    expect(screen.queryByText("Anomalies")).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });
});
