import { cache } from "react";
import { getAllProblemPages } from "@/authority/data/authorityProblemPageData";
import { getAllMethodPages } from "@/authority/data/authorityMethodPageData";
import { getAllSurfacePages } from "@/authority/data/authoritySurfacePageData";
import { getAllGuidePages } from "@/authority/data/authorityGuidePageData";
import type { SiteSearchDocument, SearchDocumentType } from "@/types/search";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildKeywords(values: Array<string | undefined | null>): string[] {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ? [value] : []))
        .map((value) => normalizeText(value).toLowerCase())
        .filter(Boolean),
    ),
  );
}

function buildBody(values: Array<string | undefined | null>): string {
  return normalizeText(
    values.flatMap((value) => (value ? [value] : [])).join(" "),
  );
}

function mapAuthorityPageToSearchDocument(input: {
  id: string;
  type: SearchDocumentType;
  title: string;
  description?: string;
  summary?: string;
  href: string;
  keywords?: string[];
  bodyParts?: string[];
}): SiteSearchDocument {
  const description = input.description ?? input.summary ?? "";
  const keywordValues = [...(input.keywords ?? []), input.title, description];

  return {
    id: input.id,
    source: "authority",
    type: input.type,
    title: input.title,
    description,
    href: input.href,
    keywords: buildKeywords(keywordValues),
    body: buildBody([description, ...(input.bodyParts ?? [])]),
  };
}

export const buildAuthoritySearchIndex = cache(
  (): SiteSearchDocument[] => {
    const problems = getAllProblemPages().map((page) =>
      mapAuthorityPageToSearchDocument({
        id: `authority:problem:${page.slug}`,
        type: "problem",
        title: page.title,
        description: page.description ?? page.summary,
        href: `/problems/${page.slug}`,
        keywords: [page.slug, "problem"],
        bodyParts: [
          page.summary,
          page.description,
          ...page.relatedMethods.map((e) => e.title),
          ...page.relatedSurfaces.map((e) => e.title),
          ...page.relatedProblems.map((e) => e.title),
        ],
      }),
    );

    const methods = getAllMethodPages().map((page) =>
      mapAuthorityPageToSearchDocument({
        id: `authority:method:${page.slug}`,
        type: "method",
        title: page.title,
        description: page.summary,
        href: `/methods/${page.slug}`,
        keywords: [page.slug, "method"],
        bodyParts: [
          page.summary,
          ...page.relatedProblems.map((e) => e.title),
          ...page.relatedSurfaces.map((e) => e.title),
          ...page.relatedMethods.map((e) => e.title),
        ],
      }),
    );

    const surfaces = getAllSurfacePages().map((page) =>
      mapAuthorityPageToSearchDocument({
        id: `authority:surface:${page.slug}`,
        type: "surface",
        title: page.title,
        description: page.summary,
        href: `/surfaces/${page.slug}`,
        keywords: [page.slug, "surface"],
        bodyParts: [
          page.summary,
          ...page.commonProblems.map((e) => e.title),
          ...page.relatedMethods.map((e) => e.title),
          ...page.relatedSurfaces.map((e) => e.title),
        ],
      }),
    );

    const guides = getAllGuidePages().map((page) =>
      mapAuthorityPageToSearchDocument({
        id: `authority:guide:${page.slug}`,
        type: "guide",
        title: page.title,
        description: page.description ?? page.summary,
        href: `/guides/${page.slug}`,
        keywords: [page.slug, "guide"],
        bodyParts: [
          page.summary,
          ...(page.description ? [page.description] : []),
          ...page.sections.flatMap((s) =>
            [s.title, s.body, ...(s.paragraphs ?? []), ...(s.bulletPoints ?? [])].filter(
              (x): x is string => typeof x === "string" && x.length > 0,
            ),
          ),
          ...page.relatedMethods.map((e) => e.title),
          ...page.relatedSurfaces.map((e) => e.title),
          ...(page.relatedProblems ?? []).map((e) => e.title),
        ],
      }),
    );

    return [...problems, ...methods, ...surfaces, ...guides].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  },
);
