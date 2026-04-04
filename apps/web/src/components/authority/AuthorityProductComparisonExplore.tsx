import Link from "next/link";

import type { AuthorityComparisonPageData } from "@/authority/types/authorityPageTypes";
import {
  formatComparisonLinkLabel,
  getComparisonSeedsByType,
  normalizeComparisonSlug,
} from "@/authority/data/authorityComparisonSelectors";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  authorityProblemSlugsForProductProblems,
  authoritySurfaceSlugsForProductSurfaces,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { peerProductSlugsForSlug } from "@/lib/products/productPeerClusters";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { AuthoritySection } from "./AuthoritySection";

export function AuthorityProductComparisonExplore({ data }: { data: AuthorityComparisonPageData }) {
  if (data.type !== "product_comparison") return null;

  const left = getProductBySlug(data.leftSlug);
  const right = getProductBySlug(data.rightSlug);
  if (!left || !right) return null;

  const sharedProblems = left.compatibleProblems.filter((p) => right.compatibleProblems.includes(p));
  const problemHubSlugs = authorityProblemSlugsForProductProblems(sharedProblems).slice(0, 5);

  const sharedProductSurfaces = (left.compatibleSurfaces ?? []).filter((s) =>
    (right.compatibleSurfaces ?? []).includes(s),
  );
  const surfaceHubSlugs = authoritySurfaceSlugsForProductSurfaces(sharedProductSurfaces).slice(0, 5);

  const peerExtra = [
    ...peerProductSlugsForSlug(data.leftSlug, 3),
    ...peerProductSlugsForSlug(data.rightSlug, 3),
  ]
    .filter((s) => s !== data.leftSlug && s !== data.rightSlug);
  const productPeers = [...new Set(peerExtra)].slice(0, 5);

  const selfSlug = normalizeComparisonSlug(data.leftSlug, data.rightSlug);
  const otherCompSlugs = getComparisonSeedsByType("product_comparison")
    .map((s) => normalizeComparisonSlug(s.leftSlug, s.rightSlug))
    .filter((slug) => slug !== selfSlug)
    .slice(0, 5);

  return (
    <AuthoritySection title="Explore next">
      <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
        Tight internal loops: problem hubs, peer SKUs, and other head-to-head pages in the same library.
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {otherCompSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">More comparisons</p>
            <ul className="mt-2 space-y-2 text-sm">
              {otherCompSlugs.map((c) => (
                <li key={c}>
                  <Link href={`/compare/products/${c}`} className="font-medium text-[#0D9488] hover:underline">
                    {formatComparisonLinkLabel("product_comparison", c)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {problemHubSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Problem hubs</p>
            <ul className="mt-2 space-y-2 text-sm">
              {problemHubSlugs.map((ps) => (
                <li key={ps}>
                  <Link
                    href={`/problems/${ps}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {getProblemPageBySlug(ps)?.title ?? ps}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {productPeers.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Related products</p>
            <ul className="mt-2 space-y-2 text-sm">
              {productPeers.map((s) => (
                <li key={s}>
                  <Link href={`/products/${s}`} className="font-medium text-[#0D9488] hover:underline">
                    {getProductBySlug(s)?.name ?? s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {surfaceHubSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Related surfaces</p>
            <ul className="mt-2 space-y-2 text-sm">
              {surfaceHubSlugs.map((ss) => (
                <li key={ss}>
                  <Link href={`/surfaces/${ss}`} className="font-medium text-[#0D9488] hover:underline">
                    {getSurfacePageBySlug(ss)?.title ?? ss}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AuthoritySection>
  );
}
