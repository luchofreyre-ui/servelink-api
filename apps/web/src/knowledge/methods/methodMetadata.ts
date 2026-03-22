import { SITE_URL } from "../../seo/seoConfig";
import { getMethodPageData } from "./methodPageData";

export type MethodPageMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  robots?: string;
};

function getMethodIndexUrl(): string {
  return `${SITE_URL}/cleaning-methods`;
}

function getMethodDetailUrl(methodSlug: string): string {
  return `${SITE_URL}/cleaning-methods/${methodSlug}`;
}

function buildMethodTitle(name: string): string {
  return `${name}: How It Works, Where It Is Safe, and When to Use It | Nu Standard Cleaning`;
}

function buildMethodDescription(summary: string): string {
  return summary.length <= 160 ? summary : `${summary.slice(0, 157).trim()}...`;
}

export function buildMethodIndexMetadata(): MethodPageMetadata {
  return {
    title: "Cleaning Methods Encyclopedia | Nu Standard Cleaning",
    description:
      "Explore cleaning methods, chemistry classes, compatible surfaces, recommended tools, and the situations where each method works best.",
    canonical: getMethodIndexUrl(),
    ogTitle: "Cleaning Methods Encyclopedia | Nu Standard Cleaning",
    ogDescription:
      "Explore cleaning methods, chemistry classes, compatible surfaces, recommended tools, and the situations where each method works best.",
    ogUrl: getMethodIndexUrl(),
    robots: "index, follow",
  };
}

export function buildMethodDetailMetadata(methodSlug: string): MethodPageMetadata {
  const data = getMethodPageData(methodSlug);

  if (!data) {
    return {
      title: "Cleaning Method Not Found | Nu Standard Cleaning",
      description: "This cleaning method page could not be found.",
      canonical: getMethodDetailUrl(methodSlug),
      ogTitle: "Cleaning Method Not Found | Nu Standard Cleaning",
      ogDescription: "This cleaning method page could not be found.",
      ogUrl: getMethodDetailUrl(methodSlug),
      robots: "noindex, nofollow",
    };
  }

  const title = buildMethodTitle(data.method.name);
  const description = buildMethodDescription(data.method.summary);
  const canonical = getMethodDetailUrl(data.method.slug);

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    robots: "index, follow",
  };
}
