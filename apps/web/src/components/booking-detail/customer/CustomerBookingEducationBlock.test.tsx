import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerBookingEducationBlock } from "./CustomerBookingEducationBlock";

describe("CustomerBookingEducationBlock", () => {
  it("renders sections and API education note", () => {
    render(
      <CustomerBookingEducationBlock
        context={{
          mayFocusOn: [{ tag: "tile", label: "Tile" }],
          relatedIssues: [{ tag: "grease-buildup", label: "Grease Buildup" }],
          careMethods: [{ tag: "degreasing", label: "Degreasing" }],
          authorityTagSource: "derived",
          educationNote: "Custom note from API for testing.",
        }}
      />,
    );

    expect(screen.getByTestId("customer-booking-education")).toBeInTheDocument();
    expect(screen.getByText("What to expect for your visit")).toBeInTheDocument();
    expect(screen.getByText("Likely attention areas")).toBeInTheDocument();
    expect(screen.getByText("Tile")).toBeInTheDocument();
    expect(screen.getByText("Related focus areas")).toBeInTheDocument();
    expect(screen.getByText("Grease Buildup")).toBeInTheDocument();
    expect(screen.getByText("Care approaches")).toBeInTheDocument();
    expect(screen.getByText("Degreasing")).toBeInTheDocument();
    expect(screen.getByText("Custom note from API for testing.")).toBeInTheDocument();
  });

  it("shows derived-source note when authorityTagSource is derived", () => {
    render(
      <CustomerBookingEducationBlock
        context={{
          mayFocusOn: [{ tag: "tile", label: "Tile" }],
          relatedIssues: [],
          careMethods: [],
          authorityTagSource: "derived",
          educationNote: "Note.",
        }}
      />,
    );
    expect(screen.getByTestId("customer-booking-education-derived-note")).toBeInTheDocument();
    expect(screen.queryByTestId("customer-booking-education-persisted-note")).toBeNull();
  });

  it("shows reviewer verification line when authorityConfidence is reviewed_for_booking", () => {
    render(
      <CustomerBookingEducationBlock
        context={{
          mayFocusOn: [{ tag: "tile", label: "Tile" }],
          relatedIssues: [],
          careMethods: [],
          authorityTagSource: "persisted",
          authorityReviewStatus: "reviewed",
          authorityConfidence: "reviewed_for_booking",
          educationNote: "Note.",
        }}
      />,
    );
    expect(screen.getByTestId("customer-booking-education-confidence")).toHaveTextContent(
      /operations reviewer/i,
    );
  });

  it("does not show confidence line for based_on_booking_details alone", () => {
    render(
      <CustomerBookingEducationBlock
        context={{
          mayFocusOn: [{ tag: "tile", label: "Tile" }],
          relatedIssues: [],
          careMethods: [],
          authorityTagSource: "persisted",
          authorityConfidence: "based_on_booking_details",
          educationNote: "Note.",
        }}
      />,
    );
    expect(screen.queryByTestId("customer-booking-education-confidence")).toBeNull();
  });

  it("shows persisted review note when authorityReviewStatus is reviewed", () => {
    render(
      <CustomerBookingEducationBlock
        context={{
          mayFocusOn: [{ tag: "tile", label: "Tile" }],
          relatedIssues: [],
          careMethods: [],
          authorityTagSource: "persisted",
          authorityReviewStatus: "reviewed",
          educationNote: "Note.",
        }}
      />,
    );
    expect(screen.getByTestId("customer-booking-education-persisted-note")).toHaveTextContent(
      /reviewed this topic list for your visit/i,
    );
    expect(screen.queryByTestId("customer-booking-education-derived-note")).toBeNull();
  });

  it("omits empty subsections", () => {
    render(
      <CustomerBookingEducationBlock
        context={{
          mayFocusOn: [{ tag: "tile", label: "Tile" }],
          relatedIssues: [],
          careMethods: [],
          authorityTagSource: "persisted",
          educationNote: "Note only.",
        }}
      />,
    );
    expect(screen.queryByText("Related focus areas")).toBeNull();
    expect(screen.queryByText("Care approaches")).toBeNull();
    expect(screen.getByText("Tile")).toBeInTheDocument();
  });
});
