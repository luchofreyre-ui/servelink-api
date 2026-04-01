import { notFound } from "next/navigation";
import { MarketingArticleTemplate } from "@/components/marketing/precision-luxury/templates/MarketingArticleTemplate";
import {
  getAllGuideSlugs,
  getArticleBySlug,
} from "@/components/marketing/precision-luxury/content/publicContentSelectors";
import {
  buildPublicEntryMetadata,
  buildPublicNotFoundMetadata,
} from "@/components/marketing/precision-luxury/content/publicContentMetadata";
import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import { AUTHORITY_GUIDE_SLUGS } from "@/authority/data/authorityTaxonomy";
import { buildAuthorityGuideDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityGuidePage } from "@/components/authority/AuthorityGuidePage";

/** Authority guides that use a dedicated static route under `guides/` (not this dynamic segment). */
const STATIC_AUTHORITY_GUIDE_ROUTES = new Set<string>([
  "chemical-usage-and-safety",
  "cleaning-every-surface",
  "how-to-remove-stains-safely",
  "when-cleaning-damages-surfaces",
  "why-cleaning-fails",
]);

function authoritySlugsForDynamicSegment(): string[] {
  return AUTHORITY_GUIDE_SLUGS.filter((s) => !STATIC_AUTHORITY_GUIDE_ROUTES.has(s));
}

export function generateStaticParams() {
  const marketing = new Set(getAllGuideSlugs());
  for (const s of authoritySlugsForDynamicSegment()) marketing.add(s);
  return [...marketing].sort((a, b) => a.localeCompare(b)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const authorityGuide = getGuidePageBySlug(slug);
  if (authorityGuide && !STATIC_AUTHORITY_GUIDE_ROUTES.has(slug)) {
    return buildAuthorityGuideDetailMetadata(authorityGuide);
  }

  const article = getArticleBySlug(slug);
  if (!article || article.kind !== "guide") {
    return buildPublicNotFoundMetadata(
      "Guide Not Found",
      "The requested guide page could not be found.",
    );
  }

  return buildPublicEntryMetadata(article);
}

export default async function MarketingGuideRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const authorityGuide = getGuidePageBySlug(slug);
  if (authorityGuide && !STATIC_AUTHORITY_GUIDE_ROUTES.has(slug)) {
    return <AuthorityGuidePage data={authorityGuide} />;
  }

  const article = getArticleBySlug(slug);
  if (!article || article.kind !== "guide") {
    notFound();
  }

  return <MarketingArticleTemplate article={article} />;
}
