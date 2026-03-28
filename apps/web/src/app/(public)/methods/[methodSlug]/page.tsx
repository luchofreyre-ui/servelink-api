import { notFound } from "next/navigation";
import { AUTHORITY_METHOD_SLUGS } from "@/authority/data/authorityTaxonomy";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { buildAuthorityMethodDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityDetailPage } from "@/components/authority/AuthorityDetailPage";
import { PublicEncyclopediaDocumentPage } from "@/components/encyclopedia/PublicEncyclopediaDocumentPage";
import {
  getEncyclopediaDocumentByCategoryAndSlug,
  getPublishedEncyclopediaSlugsByCategory,
} from "@/lib/encyclopedia/loader";

export function generateStaticParams() {
  const legacyParams = AUTHORITY_METHOD_SLUGS.map((methodSlug) => ({
    methodSlug,
  }));
  const pipelineParams = getPublishedEncyclopediaSlugsByCategory("methods").map(
    (methodSlug) => ({ methodSlug }),
  );

  const deduped = new Map(
    [...legacyParams, ...pipelineParams].map((item) => [item.methodSlug, item]),
  );

  return Array.from(deduped.values());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ methodSlug: string }>;
}) {
  const { methodSlug } = await params;

  const pipelineDocument = getEncyclopediaDocumentByCategoryAndSlug(
    "methods",
    methodSlug,
  );

  if (pipelineDocument) {
    return {
      title: `${pipelineDocument.frontmatter.title} | Cleaning Encyclopedia`,
      description: pipelineDocument.frontmatter.summary,
    };
  }

  const page = getMethodPageBySlug(methodSlug);
  if (!page) return {};
  return buildAuthorityMethodDetailMetadata(page);
}

export default async function MethodDetailRoute({
  params,
}: {
  params: Promise<{ methodSlug: string }>;
}) {
  const { methodSlug } = await params;

  const pipelineDocument = getEncyclopediaDocumentByCategoryAndSlug(
    "methods",
    methodSlug,
  );

  if (pipelineDocument) {
    return <PublicEncyclopediaDocumentPage document={pipelineDocument} />;
  }

  const data = getMethodPageBySlug(methodSlug);
  if (!data) notFound();

  return <AuthorityDetailPage variant="method" data={data} />;
}
