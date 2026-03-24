import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminCommandCenterAuthorityStrip } from "./AdminCommandCenterAuthorityStrip";

describe("AdminCommandCenterAuthorityStrip", () => {
  it("renders top surfaces, problems, methods and review status for persisted", () => {
    render(
      <AdminCommandCenterAuthorityStrip
        authority={{
          persisted: {
            surfaces: ["tile", "granite-countertops"],
            problems: ["grease-buildup"],
            methods: ["degreasing", "spot-treatment"],
            status: "overridden",
            reviewedByUserId: "u1",
            reviewedAt: "2025-03-01T00:00:00.000Z",
          },
          derived: null,
        }}
      />,
    );

    expect(
      screen.getByRole("region", { name: /command center authority/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-command-center-authority-review-status")).toHaveTextContent(
      "Overridden",
    );
    expect(screen.getByTestId("admin-command-center-authority-surfaces")).toHaveTextContent(
      "tile, granite-countertops",
    );
    expect(screen.getByTestId("admin-command-center-authority-problems")).toHaveTextContent(
      "grease-buildup",
    );
    expect(screen.getByTestId("admin-command-center-authority-methods")).toHaveTextContent(
      "degreasing, spot-treatment",
    );
    expect(screen.getByTestId("admin-command-center-authority-workflow-hint")).toHaveTextContent(
      /will not overwrite admin-overridden/i,
    );
  });

  it("renders derived snapshot with Estimated review status", () => {
    render(
      <AdminCommandCenterAuthorityStrip
        authority={{
          persisted: null,
          derived: {
            surfaces: ["shower-glass"],
            problems: ["soap-scum"],
            methods: ["glass-cleaning"],
          },
        }}
      />,
    );

    expect(screen.getByTestId("admin-command-center-authority-review-status")).toHaveTextContent(
      "Estimated",
    );
    expect(screen.getByTestId("admin-command-center-authority-surfaces")).toHaveTextContent(
      "shower-glass",
    );
  });

  it("truncates long tag lists", () => {
    const surfaces = ["a", "b", "c", "d", "e", "f"];
    render(
      <AdminCommandCenterAuthorityStrip
        authority={{
          persisted: {
            surfaces,
            problems: [],
            methods: [],
            status: "auto",
            reviewedByUserId: null,
            reviewedAt: null,
          },
          derived: null,
        }}
      />,
    );

    expect(screen.getByTestId("admin-command-center-authority-surfaces")).toHaveTextContent(
      "+1 more",
    );
  });

  it("shows empty copy when no tags", () => {
    render(
      <AdminCommandCenterAuthorityStrip
        authority={{ persisted: null, derived: null }}
      />,
    );

    expect(screen.getByTestId("admin-command-center-authority-empty")).toBeInTheDocument();
    expect(screen.getByTestId("admin-command-center-authority-review-status")).toHaveTextContent(
      "None",
    );
    expect(screen.getByTestId("admin-command-center-authority-workflow-hint")).toHaveTextContent(
      /preview only/i,
    );
  });

  it("falls back to derived tags when persisted row has no tag data", () => {
    render(
      <AdminCommandCenterAuthorityStrip
        authority={{
          persisted: {
            surfaces: [],
            problems: [],
            methods: [],
            status: "reviewed",
            reviewedByUserId: null,
            reviewedAt: null,
          },
          derived: {
            surfaces: ["tile"],
            problems: ["grease-buildup"],
            methods: ["degreasing"],
          },
        }}
      />,
    );

    expect(screen.getByTestId("admin-command-center-authority-review-status")).toHaveTextContent(
      "Estimated",
    );
    expect(screen.getByTestId("admin-command-center-authority-surfaces")).toHaveTextContent("tile");
    expect(screen.getByTestId("admin-command-center-authority-problems")).toHaveTextContent(
      "grease-buildup",
    );
  });
});
