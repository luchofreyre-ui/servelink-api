import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/problems/soap-scum",
  useSearchParams: () => new URLSearchParams(),
}));

import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { isExecutionFirstProblemLayout } from "@/lib/authority/authorityProblemExecutionLayout";

import { AuthorityProblemDetailPage } from "./AuthorityProblemDetailPage";

describe("AuthorityProblemDetailPage execution-first guardrails", () => {
  it("isExecutionFirstProblemLayout matches data gate used by the page", () => {
    const soap = getProblemPageBySlug("soap-scum");
    expect(soap).toBeDefined();
    expect(isExecutionFirstProblemLayout(soap!)).toBe(true);

    const dust = getProblemPageBySlug("dust-buildup");
    expect(dust).toBeDefined();
    expect(isExecutionFirstProblemLayout(dust!)).toBe(true);
  });

  it("execution hub: single-column top fold — no legacy quick-answer / best-method / diagnostic rail", () => {
    const data = getProblemPageBySlug("soap-scum");
    expect(data).toBeDefined();
    render(<AuthorityProblemDetailPage data={data!} />);

    expect(screen.getByTestId("execution-first-top-fold")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy-problem-top-fold-hero")).toBeNull();
    expect(screen.queryByTestId("legacy-problem-top-fold-rail")).toBeNull();
    expect(screen.queryByLabelText("Quick answer")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Best way to remove it" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "What this usually is" })).toBeNull();
  });

  it("legacy hub: renders legacy top-fold markers (not execution-first fold)", () => {
    const data = getProblemPageBySlug("fingerprints-and-smudges");
    expect(data).toBeDefined();
    expect(isExecutionFirstProblemLayout(data!)).toBe(false);
    render(<AuthorityProblemDetailPage data={data!} />);

    expect(screen.queryByTestId("execution-first-top-fold")).toBeNull();
    expect(screen.getByTestId("legacy-problem-top-fold-hero")).toBeInTheDocument();
    expect(screen.getByTestId("legacy-problem-top-fold-rail")).toBeInTheDocument();
    expect(screen.getByLabelText("Quick answer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Best way to remove it" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What this usually is" })).toBeInTheDocument();
  });
});
