import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminAuthPage from "./page";

vi.mock("@/components/auth/AuthLoginForm", () => ({
  AuthLoginForm: () => <form aria-label="Admin login form" />,
}));

describe("AdminAuthPage", () => {
  it("uses polished operations copy and keeps technical endpoint collapsed", () => {
    render(<AdminAuthPage />);

    expect(
      screen.getByRole("heading", {
        name: "Sign in to the operations workspace",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use your admin credentials/)).toBeInTheDocument();
    expect(screen.queryByText("Authenticate the real admin console.")).toBeNull();
    expect(screen.getByText("Technical sign-in details")).toBeInTheDocument();
  });
});
