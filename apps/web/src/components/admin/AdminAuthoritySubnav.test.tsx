import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminAuthoritySubnav } from "./AdminAuthoritySubnav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/authority/review-queue",
}));

describe("AdminAuthoritySubnav", () => {
  it("renders encyclopedia authority links", () => {
    render(<AdminAuthoritySubnav />);
    expect(screen.getByTestId("admin-authority-subnav")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-subnav-review-queue")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByTestId("admin-authority-subnav-overview")).toHaveAttribute(
      "data-active",
      "false",
    );
    expect(screen.getByTestId("admin-authority-subnav-admin-home")).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
