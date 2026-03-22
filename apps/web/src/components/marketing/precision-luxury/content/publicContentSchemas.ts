import {
  PUBLIC_SITE_NAME,
  PUBLIC_SITE_URL,
  type PublicArticleEntry,
  type PublicServiceEntry,
} from "./publicContentRegistry";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PUBLIC_SITE_NAME,
    url: PUBLIC_SITE_URL,
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PUBLIC_SITE_NAME,
    url: PUBLIC_SITE_URL,
  };
}

export function buildServiceSchema(service: PublicServiceEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: PUBLIC_SITE_NAME,
      url: PUBLIC_SITE_URL,
    },
    areaServed: {
      "@type": "Place",
      name: "Service Area",
    },
    url: `${PUBLIC_SITE_URL}/services/${service.slug}`,
    serviceType: service.title,
  };
}

export function buildArticleSchema(article: PublicArticleEntry) {
  const path =
    article.kind === "question"
      ? `/questions/${article.slug}`
      : `/guides/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Organization",
      name: PUBLIC_SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: PUBLIC_SITE_NAME,
    },
    mainEntityOfPage: `${PUBLIC_SITE_URL}${path}`,
  };
}

export function buildFAQSchema(
  items: Array<{ q: string; a: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
