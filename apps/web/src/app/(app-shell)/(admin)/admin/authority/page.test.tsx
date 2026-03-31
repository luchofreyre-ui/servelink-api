import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminAuthorityHubPage from "./page";

describe("AdminAuthorityHubPage", () => {
  it("renders encyclopedia authority cards with correct hrefs", () => {
    render(<AdminAuthorityHubPage />);
    expect(screen.getByTestId("admin-authority-hub-page")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-hub-card-overview")).toHaveAttribute(
      "href",
      "/admin/authority",
    );
    expect(screen.getByTestId("admin-authority-hub-card-review-queue")).toHaveAttribute(
      "href",
      "/admin/authority/review-queue",
    );
    expect(screen.getByTestId("admin-authority-hub-card-cluster-density")).toHaveAttribute(
      "href",
      "/admin/authority/cluster-density",
    );
    expect(screen.getByTestId("admin-authority-hub-card-batches")).toHaveAttribute(
      "href",
      "/admin/authority/batches",
    );
  });
});
