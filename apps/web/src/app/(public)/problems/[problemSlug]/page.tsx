import { notFound } from "next/navigation";
import { AUTHORITY_PROBLEM_SLUGS } from "@/authority/data/authorityTaxonomy";
import { AuthorityProblemDetailPage } from "@/components/authority/AuthorityProblemDetailPage";
import { PublicEncyclopediaDocumentPage } from "@/components/encyclopedia/PublicEncyclopediaDocumentPage";
import { buildAuthorityProblemDetailMetadata } from "@/lib/authority/buildAuthorityProblemDetailMetadata";
import { AUTHORITY_OWNED_PROBLEM_SLUGS } from "@/lib/authority/authorityOwnedProblemHubs";
import { getProblemPageBySlug } from "@/lib/authority/authorityProblemPageData";
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

type Props = {
  params: Promise<{ problemSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { problemSlug } = await params;

  if (AUTHORITY_OWNED_PROBLEM_SLUGS.has(problemSlug)) {
    const data = getProblemPageBySlug(problemSlug);
    if (!data) return {};
    return buildAuthorityProblemDetailMetadata(data);
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

export default async function ProblemPage({ params }: Props) {
  const { problemSlug } = await params;

  if (AUTHORITY_OWNED_PROBLEM_SLUGS.has(problemSlug)) {
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
