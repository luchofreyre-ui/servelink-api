import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/problems/dust-buildup",
  useSearchParams: () => new URLSearchParams(),
}));

import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { AuthorityProblemDetailPage } from "./AuthorityProblemDetailPage";

describe("Authority product presence", () => {
  it("renders top-fold conversion block when a scenario pins a product (execution-first)", () => {
    const data = getProblemPageBySlug("dust-buildup");
    expect(data).toBeDefined();
    expect(data!.productScenarios?.some((s) => (s.products?.length ?? 0) > 0)).toBe(true);

    render(<AuthorityProblemDetailPage data={data!} />);

    expect(screen.getByText(/Most effective option for this problem/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This is the fastest way to get results without trial and error/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Used in this method\. No guesswork required/i)).toBeInTheDocument();

    const topFold = screen.getByTestId("execution-first-top-fold");
    const inFold = within(topFold);
    expect(inFold.getByText(/^Best overall$/i)).toBeInTheDocument();
    expect(inFold.getByText(/^Stronger option$/i)).toBeInTheDocument();
    expect(inFold.getByText(/^Maintenance$/i)).toBeInTheDocument();
    expect(inFold.getAllByRole("link", { name: /Buy →/i })).toHaveLength(3);
    expect(screen.getAllByText(/Compare top options/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Not sure\? Compare them/i)).toBeInTheDocument();

    const close = screen.getByTestId("authority-problem-best-next-move");
    expect(within(close).getByText(/Best next move/i)).toBeInTheDocument();
    expect(
      within(close).getByText(/Start with the strongest recommended option for this problem/i),
    ).toBeInTheDocument();
    expect(within(close).getByText(/Buy the recommended option/i)).toBeInTheDocument();
    expect(within(close).getByText(/See all recommended products/i)).toBeInTheDocument();
    expect(within(close).getAllByText(/Compare top options/i).length).toBeGreaterThanOrEqual(1);
  });

  it("does not render compare links when no comparison exists in the lattice", () => {
    const base = getProblemPageBySlug("dust-buildup")!;
    const data = {
      ...base,
      productScenarios: [
        {
          problem: "dust buildup",
          surface: "hardwood",
          products: [
            { slug: "nonexistent-product-a", name: "Fake A" },
            { slug: "nonexistent-product-b", name: "Fake B" },
            { slug: "nonexistent-product-c", name: "Fake C" },
          ],
        },
      ],
    };

    render(<AuthorityProblemDetailPage data={data} />);

    expect(screen.queryByText(/Compare top options/i)).toBeNull();
    expect(screen.queryByText(/Not sure\? Compare them/i)).toBeNull();
  });
});
