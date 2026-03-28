import { cache } from "react";
import {
  getEncyclopediaCategorySummaries,
  getPublishedEncyclopediaParams,
  getEncyclopediaDocumentByCategoryAndSlug,
} from "@/lib/encyclopedia/loader";
import { formatEncyclopediaCategoryLabel } from "@/lib/encyclopedia/slug";
import type { EncyclopediaCategory } from "@/lib/encyclopedia/types";
import type { SiteSearchDocument } from "@/types/search";

function encyclopediaCategoryToSearchType(
  category: EncyclopediaCategory,
): SiteSearchDocument["type"] {
  if (category === "problems") return "problem";
  if (category === "methods") return "method";
  if (category === "surfaces") return "surface";
  return "encyclopedia";
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildKeywordsForDocument(input: {
  category: string;
  cluster: string;
  title: string;
  slug: string;
  relatedTitles: string[];
}): string[] {
  const values = [
    input.category,
    input.cluster,
    input.title,
    input.slug.replace(/-/g, " "),
    ...input.relatedTitles,
  ];

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value).toLowerCase())
        .filter(Boolean),
    ),
  );
}

export const buildEncyclopediaSearchIndex = cache(
  (): SiteSearchDocument[] => {
    const params = getPublishedEncyclopediaParams();
    const categorySummaries = getEncyclopediaCategorySummaries();
    const categoryLabelMap = new Map(
      categorySummaries.map((summary) => [summary.category, summary.label]),
    );

    const documents: SiteSearchDocument[] = [];

    for (const param of params) {
      const document = getEncyclopediaDocumentByCategoryAndSlug(
        param.category,
        param.slug,
      );

      if (!document) {
        continue;
      }

      const categoryLabel =
        categoryLabelMap.get(document.frontmatter.category) ??
        formatEncyclopediaCategoryLabel(document.frontmatter.category);

      const sectionText = document.sections
        .map((section) => `${section.heading} ${section.body}`)
        .join(" ");

      const relatedTitles = document.relatedEntries.map((entry) => entry.title);

      documents.push({
        id: `encyclopedia:${document.frontmatter.category}:${document.frontmatter.slug}`,
        source: "encyclopedia",
        type: encyclopediaCategoryToSearchType(document.frontmatter.category),
        title: document.frontmatter.title,
        description: document.frontmatter.summary,
        href: `/encyclopedia/${document.frontmatter.category}/${document.frontmatter.slug}`,
        keywords: buildKeywordsForDocument({
          category: categoryLabel,
          cluster: document.frontmatter.cluster,
          title: document.frontmatter.title,
          slug: document.frontmatter.slug,
          relatedTitles,
        }),
        body: normalizeText(
          [
            categoryLabel,
            document.frontmatter.cluster,
            document.frontmatter.summary,
            sectionText,
            ...relatedTitles,
          ].join(" "),
        ),
      });
    }

    return documents.sort((a, b) => a.title.localeCompare(b.title));
  },
);
