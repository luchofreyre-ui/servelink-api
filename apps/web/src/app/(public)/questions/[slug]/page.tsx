import { notFound } from "next/navigation";
import { MarketingArticleTemplate } from "@/components/marketing/precision-luxury/templates/MarketingArticleTemplate";
import {
  getAllQuestionSlugs,
  getArticleBySlug,
} from "@/components/marketing/precision-luxury/content/publicContentSelectors";
import {
  buildPublicEntryMetadata,
  buildPublicNotFoundMetadata,
} from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export function generateStaticParams() {
  return getAllQuestionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.kind !== "question") {
    return buildPublicNotFoundMetadata(
      "Question Not Found",
      "The requested question page could not be found.",
    );
  }

  return buildPublicEntryMetadata(article);
}

export default async function MarketingQuestionRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.kind !== "question") {
    notFound();
  }

  return <MarketingArticleTemplate article={article} />;
}
