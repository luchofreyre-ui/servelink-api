import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_OWNED_PROBLEM_SLUGS } from "@/lib/authority/authorityOwnedProblemHubs";

vi.mock("@/lib/authority/authorityProblemPageData", () => ({
  getProblemPageBySlug: (slug: string) => ({
    slug,
    title: "Test Problem",
    problemDefinitionLine: "Definition",
    executionQuickFix: "Quick fix",
  }),
}));

vi.mock("@/components/authority/AuthorityProblemDetailPage", () => ({
  AuthorityProblemDetailPage: ({ data }: { data: { slug: string } }) => (
    <div data-testid="authority-page">{data.slug}</div>
  ),
}));

import ProblemPage from "../[problemSlug]/page";

describe("Authority override route behavior", () => {
  it("renders authority page for owned slug", async () => {
    const slug = [...AUTHORITY_OWNED_PROBLEM_SLUGS][0];

    const ui = await ProblemPage({
      params: Promise.resolve({ problemSlug: slug }),
    });
    render(ui);

    expect(screen.getByTestId("authority-page")).toHaveTextContent(slug);
  });
});
