import { notFound } from "next/navigation";
import { AUTHORITY_PROBLEM_SLUGS } from "@/authority/data/authorityTaxonomy";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { buildAuthorityProblemDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityProblemDetailPage } from "@/components/authority/AuthorityProblemDetailPage";

export function generateStaticParams() {
  return AUTHORITY_PROBLEM_SLUGS.map((problemSlug) => ({ problemSlug }));
}

export async function generateMetadata({ params }: { params: Promise<{ problemSlug: string }> }) {
  const { problemSlug } = await params;
  const page = getProblemPageBySlug(problemSlug);
  if (!page) return {};
  return buildAuthorityProblemDetailMetadata(page);
}

export default async function ProblemDetailRoute({ params }: { params: Promise<{ problemSlug: string }> }) {
  const { problemSlug } = await params;
  const data = getProblemPageBySlug(problemSlug);
  if (!data) notFound();
  return <AuthorityProblemDetailPage data={data} />;
}
