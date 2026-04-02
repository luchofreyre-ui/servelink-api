import type { ReactNode } from "react";
import Link from "next/link";

import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import { getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import RecommendedProductsForTopic from "@/components/products/RecommendedProductsForTopic";

type Scenario = { problem: string; surface: string; playbookHref: string; label: string };

function buildScenarios(slug: string, data: AuthorityProblemPageData): Scenario[] {
  if (data.productScenarios?.length) {
    return data.productScenarios.map((row) => ({
      problem: row.problem,
      surface: row.surface,
      playbookHref: `/problems/${slug}`,
      label: `${row.problem} on ${row.surface}`,
    }));
  }

  const out: Scenario[] = [];
  for (const surfaceSlug of getSurfaceSlugsForProblem(slug)) {
    const p = productProblemStringForAuthorityProblemSlug(slug);
    const s = productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug);
    if (!p || !s) continue;
    out.push({
      problem: p,
      surface: s,
      playbookHref: `/surfaces/${surfaceSlug}/${slug}`,
      label: `${p} on ${s}`,
    });
  }
  return out.slice(0, 6);
}

export function AuthorityProblemProductHub({ data }: { data: AuthorityProblemPageData }) {
  const scenarios = buildScenarios(data.slug, data);
  if (!scenarios.length) return null;

  return (
    <AuthoritySectionWrap title="Best products by surface (ranked)">
      <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
        These picks come from the same recommendation engine as the product library—paired to real{" "}
        <span className="font-medium text-[#0F172A]">{data.title.toLowerCase()}</span> scenarios. Open the
        playbook link for the full surface + problem context.
      </p>
      <div className="mt-8 space-y-10">
        {scenarios.map((sc) => (
          <div key={`${sc.problem}|${sc.surface}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">{sc.label}</h3>
              <Link href={sc.playbookHref} className="text-sm font-medium text-[#0D9488] hover:underline">
                View playbook →
              </Link>
            </div>
            <RecommendedProductsForTopic
              problem={sc.problem}
              surface={sc.surface}
              densityAuthorityProblemSlug={data.slug}
            />
          </div>
        ))}
      </div>
    </AuthoritySectionWrap>
  );
}

function AuthoritySectionWrap({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t border-[#C9B27C]/20 pt-12">
      <h2 className="font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
