import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SiteSearchDocument } from "@/types/search";
import { SearchResultsPage } from "./SearchResultsPage";

describe("SearchResultsPage stacking funnel", () => {
  it("surfaces funnel sublabels and top-result kicker for authority → compare → product", () => {
    const results: SiteSearchDocument[] = [
      {
        id: "p1",
        source: "authority",
        type: "problem",
        title: "Dust buildup",
        description: "Hub summary.",
        href: "/problems/dust-buildup",
        keywords: [],
        body: "",
      },
      {
        id: "c1",
        source: "injected",
        type: "product_comparison",
        title: "Compare Bona vs Zep",
        description: "",
        href: "/compare/products/bona-vs-zep",
        keywords: [],
        body: "",
      },
      {
        id: "pr1",
        source: "injected",
        type: "product",
        title: "Bona Floor Cleaner",
        description: "",
        href: "/products/bona-hard-surface-floor-cleaner",
        keywords: [],
        body: "",
      },
    ];

    render(<SearchResultsPage query="dust" results={results} />);

    expect(screen.getByText(/Best place to start/i)).toBeInTheDocument();
    expect(screen.getByText(/Start here/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare options/i)).toBeInTheDocument();
    expect(screen.getByText(/Buy recommended product/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dust buildup/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open page/i }).length).toBeGreaterThan(0);
  });
});
