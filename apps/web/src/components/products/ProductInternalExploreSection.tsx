import Link from "next/link";

import { authorityProblemSlugsForProductProblems } from "@/lib/authority/authorityProductTaxonomyBridge";
import {
  formatComparisonLinkLabel,
  getComparisonSlugsForEntity,
} from "@/authority/data/authorityComparisonSelectors";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { peerProductSlugsForSlug } from "@/lib/products/productPeerClusters";
import { getProductBySlug } from "@/lib/products/productRegistry";

export function ProductInternalExploreSection(props: {
  slug: string;
  compatibleProblems: string[];
}) {
  const { slug, compatibleProblems } = props;
  const compareSlugs = getComparisonSlugsForEntity("product_comparison", slug).slice(0, 3);
  const problemSlugs = authorityProblemSlugsForProductProblems(compatibleProblems).slice(0, 3);
  const peerSlugs = peerProductSlugsForSlug(slug, 3).filter((s) => s !== slug);

  if (!compareSlugs.length && !problemSlugs.length && !peerSlugs.length) return null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Explore next</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Problem hubs, head-to-head comparisons, and peer SKUs in the same library cluster.
      </p>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        {compareSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Comparisons</p>
            <ul className="mt-2 space-y-1 text-sm">
              {compareSlugs.map((c) => (
                <li key={c}>
                  <Link href={`/compare/products/${c}`} className="text-[#0D9488] hover:underline">
                    {formatComparisonLinkLabel("product_comparison", c)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {problemSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Problem hubs</p>
            <ul className="mt-2 space-y-1 text-sm">
              {problemSlugs.map((ps) => (
                <li key={ps}>
                  <Link
                    href={`/problems/${ps}`}
                    className="text-[#0D9488] hover:underline"
                  >
                    {getProblemPageBySlug(ps)?.title ?? ps}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {peerSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Peer products</p>
            <ul className="mt-2 space-y-1 text-sm">
              {peerSlugs.map((s) => {
                const p = getProductBySlug(s);
                return (
                  <li key={s}>
                    <Link href={`/products/${s}`} className="text-[#0D9488] hover:underline">
                      {p?.name ?? s}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
