import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FranchiseOwnerBookingDetail } from "./FranchiseOwnerBookingDetail";

describe("FranchiseOwnerBookingDetail", () => {
  it("renders recommended knowledge block with links from screen payload", () => {
    render(
      <FranchiseOwnerBookingDetail
        screen={{
          booking: { id: "bk_1", status: "assigned" },
          knowledgeLinks: [
            {
              kind: "problem",
              slug: "limescale",
              pathname: "/problems/hard-water-deposits",
              title: "Hard Water Deposits",
              sourceTags: ["limescale"],
            },
          ],
          authorityTagSource: "persisted",
        }}
        fleetScreens={[]}
      />,
    );

    expect(screen.getByTestId("fo-recommended-knowledge")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hard Water Deposits" })).toHaveAttribute(
      "href",
      "/problems/hard-water-deposits",
    );
  });

  it("shows recommended knowledge empty state when no links", () => {
    render(
      <FranchiseOwnerBookingDetail
        screen={{
          booking: { id: "bk_2", status: "assigned" },
          knowledgeLinks: [],
        }}
        fleetScreens={[]}
      />,
    );

    expect(screen.getByTestId("fo-recommended-knowledge")).toBeInTheDocument();
    expect(
      screen.getByText(/No authority-linked topics for this booking yet/i),
    ).toBeInTheDocument();
  });
});
