import { SITE_URL } from "../../seo/seoConfig";
import { getToolPageData } from "./toolPageData";

export type ToolPageMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  robots?: string;
};

function getToolIndexUrl(): string {
  return `${SITE_URL}/cleaning-tools`;
}

function getToolDetailUrl(toolSlug: string): string {
  return `${SITE_URL}/cleaning-tools/${toolSlug}`;
}

function buildToolTitle(name: string): string {
  return `${name}: Best Uses, Surface Safety, and Cleaning Guidance | Nu Standard Cleaning`;
}

function buildToolDescription(summary: string): string {
  return summary.length <= 160 ? summary : `${summary.slice(0, 157).trim()}...`;
}

export function buildToolIndexMetadata(): ToolPageMetadata {
  return {
    title: "Cleaning Tools Encyclopedia | Nu Standard Cleaning",
    description:
      "Explore cleaning tools, what they work best for, which surfaces they fit, where they should be avoided, and how to use them correctly.",
    canonical: getToolIndexUrl(),
    ogTitle: "Cleaning Tools Encyclopedia | Nu Standard Cleaning",
    ogDescription:
      "Explore cleaning tools, what they work best for, which surfaces they fit, where they should be avoided, and how to use them correctly.",
    ogUrl: getToolIndexUrl(),
    robots: "index, follow",
  };
}

export function buildToolDetailMetadata(toolSlug: string): ToolPageMetadata {
  const data = getToolPageData(toolSlug);

  if (!data) {
    return {
      title: "Cleaning Tool Not Found | Nu Standard Cleaning",
      description: "This cleaning tool page could not be found.",
      canonical: getToolDetailUrl(toolSlug),
      ogTitle: "Cleaning Tool Not Found | Nu Standard Cleaning",
      ogDescription: "This cleaning tool page could not be found.",
      ogUrl: getToolDetailUrl(toolSlug),
      robots: "noindex, nofollow",
    };
  }

  const title = buildToolTitle(data.tool.name);
  const description = buildToolDescription(data.tool.summary);
  const canonical = getToolDetailUrl(data.tool.slug);

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
