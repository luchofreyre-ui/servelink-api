import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncyclopediaPage } from "@/components/encyclopedia/EncyclopediaPage";
import { getEncyclopediaDocumentByCategoryAndSlug, getPublishedEncyclopediaParams } from "@/lib/encyclopedia/loader";
import { encyclopediaCategorySchema } from "@/lib/encyclopedia/schema";

interface EncyclopediaDocPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getPublishedEncyclopediaParams();
}

export async function generateMetadata({
  params,
}: EncyclopediaDocPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const category = encyclopediaCategorySchema.parse(resolvedParams.category);
  const document = getEncyclopediaDocumentByCategoryAndSlug(
    category,
    resolvedParams.slug,
  );

  if (!document) {
    return {
      title: "Encyclopedia",
    };
  }

  return {
    title: `${document.frontmatter.title} | Cleaning Encyclopedia`,
    description: document.frontmatter.summary,
  };
}

export default async function EncyclopediaDocPage({
  params,
}: EncyclopediaDocPageProps) {
  const resolvedParams = await params;
  const category = encyclopediaCategorySchema.safeParse(
    resolvedParams.category,
  );

  if (!category.success) {
    notFound();
  }

  const document = getEncyclopediaDocumentByCategoryAndSlug(
    category.data,
    resolvedParams.slug,
  );

  if (!document) {
    notFound();
  }

  return <EncyclopediaPage document={document} />;
}
