import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FoRecommendedKnowledgeBlock } from "./FoRecommendedKnowledgeBlock";

const mockSubmit = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "tok"));

vi.mock("@/lib/api/foAuthorityKnowledgeFeedback", () => ({
  submitFoAuthorityKnowledgeFeedback: mockSubmit,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

describe("FoRecommendedKnowledgeBlock", () => {
  beforeEach(() => {
    mockSubmit.mockReset();
  });

  it("renders operational links when knowledgeLinks are present", () => {
    render(
      <FoRecommendedKnowledgeBlock
        bookingId="bk_1"
        screen={{
          knowledgeLinks: [
            {
              kind: "problem",
              slug: "grease-buildup",
              pathname: "/problems/grease-buildup",
              title: "Grease Buildup",
              sourceTags: ["grease-buildup"],
            },
            {
              kind: "surface",
              slug: "tile",
              pathname: "/surfaces/tile",
              title: "Tile",
              sourceTags: ["tile"],
            },
          ],
          authorityTagSource: "persisted",
        }}
      />,
    );

    expect(screen.getByTestId("fo-recommended-knowledge")).toBeInTheDocument();
    expect(screen.getByText("Recommended knowledge")).toBeInTheDocument();
    expect(screen.getByText("Source: saved intelligence")).toBeInTheDocument();

    const grease = screen.getByRole("link", { name: "Grease Buildup" });
    expect(grease).toHaveAttribute("href", "/encyclopedia/problems/grease-buildup");
    const tile = screen.getByRole("link", { name: "Tile" });
    expect(tile).toHaveAttribute("href", "/surfaces/tile");

    expect(screen.getByText(/Tags: grease-buildup/)).toBeInTheDocument();
  });

  it("shows derived source label when authorityTagSource is derived", () => {
    render(
      <FoRecommendedKnowledgeBlock
        bookingId="bk_2"
        screen={{
          knowledgeLinks: [
            {
              kind: "method",
              slug: "degreasing",
              pathname: "/methods/degreasing",
              title: "Degreasing",
              sourceTags: [],
            },
          ],
          authorityTagSource: "derived",
        }}
      />,
    );
    expect(screen.getByText("Source: derived from notes & quote")).toBeInTheDocument();
  });

  it("renders empty state when knowledgeLinks is absent or empty", () => {
    render(<FoRecommendedKnowledgeBlock bookingId="bk_e" screen={{}} />);
    expect(
      screen.getByText(/No authority-linked topics for this booking yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders empty state for empty knowledgeLinks array", () => {
    render(<FoRecommendedKnowledgeBlock bookingId="bk_e2" screen={{ knowledgeLinks: [] }} />);
    expect(
      screen.getByText(/No authority-linked topics for this booking yet/i),
    ).toBeInTheDocument();
  });

  it("skips invalid link rows and drops source line when no valid links", () => {
    render(
      <FoRecommendedKnowledgeBlock
        screen={{
          knowledgeLinks: [{ kind: "problem", title: "Incomplete" }],
          authorityTagSource: "persisted",
        }}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.getByText(/No authority-linked topics for this booking yet/i),
    ).toBeInTheDocument();
  });

  it("uses alternate empty copy when tags exist but knowledge links are empty", () => {
    render(
      <FoRecommendedKnowledgeBlock
        bookingId="bk_tag"
        screen={{
          knowledgeLinks: [],
          authorityTagSource: "persisted",
          authorityHasTaggedRows: true,
          authorityReviewStatus: "reviewed",
        }}
      />,
    );
    expect(
      screen.getByText(/none map to public knowledge articles yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ops reviewed the saved classification/i),
    ).toBeInTheDocument();
  });

  it("shows sending state while feedback request is in flight", async () => {
    let resolveSubmit: (v: unknown) => void = () => {};
    const pending = new Promise((r) => {
      resolveSubmit = r;
    });
    mockSubmit.mockReturnValue(pending);

    const user = userEvent.setup();
    render(
      <FoRecommendedKnowledgeBlock
        bookingId="bk_slow"
        screen={{
          knowledgeLinks: [
            {
              kind: "problem",
              slug: "x",
              pathname: "/problems/x",
              title: "Topic",
              sourceTags: [],
            },
          ],
        }}
      />,
    );

    const clickPromise = user.click(screen.getByTestId("fo-knowledge-feedback-useful"));
    expect(await screen.findByTestId("fo-knowledge-feedback-sending")).toBeInTheDocument();
    resolveSubmit({
      kind: "fo_authority_knowledge_feedback",
      id: "fb_slow",
      bookingId: "bk_slow",
      helpful: true,
      createdAt: new Date().toISOString(),
    });
    await clickPromise;
    await screen.findByTestId("fo-knowledge-feedback-thanks");
  });

  it("does not double-submit when useful is clicked twice", async () => {
    let resolveSubmit!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveSubmit = r;
    });
    mockSubmit.mockReturnValue(pending);
    render(
      <FoRecommendedKnowledgeBlock
        bookingId="bk_double"
        screen={{
          knowledgeLinks: [
            {
              kind: "problem",
              slug: "x",
              pathname: "/problems/x",
              title: "Topic",
              sourceTags: [],
            },
          ],
        }}
      />,
    );
    const useful = screen.getByTestId("fo-knowledge-feedback-useful");
    fireEvent.click(useful);
    fireEvent.click(useful);
    resolveSubmit({
      kind: "fo_authority_knowledge_feedback",
      id: "fb_d",
      bookingId: "bk_double",
      helpful: true,
      createdAt: new Date().toISOString(),
    });
    await screen.findByTestId("fo-knowledge-feedback-thanks");
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("submits useful feedback via API", async () => {
    mockSubmit.mockResolvedValue({
      kind: "fo_authority_knowledge_feedback",
      id: "fb1",
      bookingId: "bk_fb",
      helpful: true,
      createdAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    render(
      <FoRecommendedKnowledgeBlock
        bookingId="bk_fb"
        screen={{
          knowledgeLinks: [
            {
              kind: "problem",
              slug: "x",
              pathname: "/problems/x",
              title: "Topic",
              sourceTags: [],
            },
          ],
        }}
      />,
    );
    await user.click(screen.getByTestId("fo-knowledge-feedback-useful"));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.any(String),
      "tok",
      "bk_fb",
      expect.objectContaining({ helpful: true }),
    );
    await screen.findByTestId("fo-knowledge-feedback-thanks");
    expect(screen.getByTestId("fo-knowledge-feedback-thanks")).toHaveTextContent(
      /Feedback received/i,
    );
  });
});
