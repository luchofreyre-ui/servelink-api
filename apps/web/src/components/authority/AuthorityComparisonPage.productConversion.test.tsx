import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/compare/products/bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner",
  useSearchParams: () => new URLSearchParams(),
}));

import { buildProductComparisonPage } from "@/authority/data/authorityComparisonBuilder";
import { AuthorityComparisonPage } from "./AuthorityComparisonPage";

describe("AuthorityComparisonPage product conversion", () => {
  it("renders winner block, pick lines, and multiple buy links", () => {
    const data = buildProductComparisonPage("bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner");
    expect(data).not.toBeNull();
    expect(data!.type).toBe("product_comparison");

    render(
      <AuthorityComparisonPage
        data={data!}
        breadcrumbs={[{ label: "Compare", href: "/compare/products" }]}
        path="/compare/products/bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner"
      />,
    );

    expect(screen.getByText(/Best choice for most people/i)).toBeInTheDocument();
    expect(screen.getByText(/better choice for this problem/i)).toBeInTheDocument();
    expect(screen.getByText(/Why not start with/i)).toBeInTheDocument();
    expect(screen.getAllByText(/-/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Who should choose what/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Buy/i).length).toBeGreaterThan(1);
    expect(screen.getByText(/Buy the better choice/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Buy/i }).length).toBeGreaterThan(2);

    expect(screen.getByTestId("comparison-best-next-move")).toBeInTheDocument();
    expect(screen.getByText(/Best next move/i)).toBeInTheDocument();
    expect(screen.getByText(/Buy the recommended option/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Still want the alternative/i })).toBeInTheDocument();
  });
});
