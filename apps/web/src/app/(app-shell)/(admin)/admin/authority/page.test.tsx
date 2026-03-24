import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminAuthorityIntelHubPage from "./page";

describe("AdminAuthorityIntelHubPage", () => {
  it("links to core authority surfaces", () => {
    render(<AdminAuthorityIntelHubPage />);
    expect(screen.getByTestId("admin-authority-hub-page")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-hub-link-report")).toHaveAttribute(
      "href",
      "/admin/authority/report",
    );
    expect(screen.getByTestId("admin-authority-hub-link-quality")).toHaveAttribute(
      "href",
      "/admin/authority/quality",
    );
    expect(screen.getByTestId("admin-authority-hub-link-drift")).toHaveAttribute(
      "href",
      "/admin/authority/drift",
    );
    expect(screen.getByTestId("admin-authority-hub-link-alerts")).toHaveAttribute(
      "href",
      "/admin/authority/alerts",
    );
  });
});
