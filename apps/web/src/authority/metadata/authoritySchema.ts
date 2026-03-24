import type { AuthorityFaqItem } from "../types/authorityPageTypes";

function toAbsoluteUrl(path: string): string {
  return `https://www.nustandardcleaning.com${path}`;
}

export function buildBreadcrumbListSchema(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: toAbsoluteUrl(item.href),
    })),
  };
}

export function buildArticleSchema({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: toAbsoluteUrl(path),
    author: {
      "@type": "Organization",
      name: "Nu Standard Cleaning",
    },
    publisher: {
      "@type": "Organization",
      name: "Nu Standard Cleaning",
    },
    mainEntityOfPage: toAbsoluteUrl(path),
  };
}

export function buildDefinedTermSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name,
    description,
    url: toAbsoluteUrl(path),
    inDefinedTermSet: toAbsoluteUrl("/encyclopedia"),
  };
}

export function buildFaqSchema(items: AuthorityFaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildCollectionPageSchema({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: toAbsoluteUrl(path),
  };
}
