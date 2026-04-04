import { notFound } from "next/navigation";
import { AUTHORITY_PROBLEM_SLUGS } from "@/authority/data/authorityTaxonomy";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { buildAuthorityProblemDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityProblemDetailPage } from "@/components/authority/AuthorityProblemDetailPage";
import { PublicEncyclopediaDocumentPage } from "@/components/encyclopedia/PublicEncyclopediaDocumentPage";
import { isAuthorityOwnedProblemHub } from "@/lib/authority/authorityOwnedProblemHubs";
import {
  getEncyclopediaDocumentByCategoryAndSlug,
  getPublishedEncyclopediaSlugsByCategory,
} from "@/lib/encyclopedia/loader";

export function generateStaticParams() {
  const legacyParams = AUTHORITY_PROBLEM_SLUGS.map((problemSlug) => ({
    problemSlug,
  }));
  const pipelineParams = getPublishedEncyclopediaSlugsByCategory("problems").map(
    (problemSlug) => ({ problemSlug }),
  );

  const deduped = new Map(
    [...legacyParams, ...pipelineParams].map((item) => [item.problemSlug, item]),
  );

  return Array.from(deduped.values());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ problemSlug: string }>;
}) {
  const { problemSlug } = await params;

  if (isAuthorityOwnedProblemHub(problemSlug)) {
    const page = getProblemPageBySlug(problemSlug);
    if (!page) return {};
    return buildAuthorityProblemDetailMetadata(page);
  }

  const pipelineDocument = getEncyclopediaDocumentByCategoryAndSlug(
    "problems",
    problemSlug,
  );

  if (pipelineDocument) {
    return {
      title: `${pipelineDocument.frontmatter.title} | Cleaning Encyclopedia`,
      description: pipelineDocument.frontmatter.summary,
    };
  }

  const page = getProblemPageBySlug(problemSlug);
  if (!page) return {};
  return buildAuthorityProblemDetailMetadata(page);
}

export default async function ProblemDetailRoute({
  params,
}: {
  params: Promise<{ problemSlug: string }>;
}) {
  const { problemSlug } = await params;

  if (isAuthorityOwnedProblemHub(problemSlug)) {
    const data = getProblemPageBySlug(problemSlug);
    if (!data) notFound();
    return <AuthorityProblemDetailPage data={data} />;
  }

  const pipelineDocument = getEncyclopediaDocumentByCategoryAndSlug(
    "problems",
    problemSlug,
  );

  if (pipelineDocument) {
    return <PublicEncyclopediaDocumentPage document={pipelineDocument} />;
  }

  const data = getProblemPageBySlug(problemSlug);
  if (!data) notFound();

  return <AuthorityProblemDetailPage data={data} />;
}
