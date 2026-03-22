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

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.kind !== "guide") {
    return buildPublicNotFoundMetadata(
      "Guide Not Found",
      "The requested guide page could not be found.",
    );
  }

  return buildPublicEntryMetadata(article);
}

export default async function MarketingGuideRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.kind !== "guide") {
    notFound();
  }

  return <MarketingArticleTemplate article={article} />;
}
