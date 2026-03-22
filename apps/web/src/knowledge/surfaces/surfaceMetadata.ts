import { SITE_URL } from "../../seo/seoConfig";
import { getSurfacePageData } from "./surfacePageData";

export type SurfacePageMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  robots?: string;
};

function getSurfaceIndexUrl(): string {
  return `${SITE_URL}/cleaning-surfaces`;
}

function getSurfaceDetailUrl(surfaceSlug: string): string {
  return `${SITE_URL}/cleaning-surfaces/${surfaceSlug}`;
}

function buildSurfaceTitle(name: string): string {
  return `${name}: Safe Cleaning Methods, Risks, and Care | Nu Standard Cleaning`;
}

function buildSurfaceDescription(summary: string): string {
  return summary.length <= 160
    ? summary
    : `${summary.slice(0, 157).trim()}...`;
}

export function buildSurfaceIndexMetadata(): SurfacePageMetadata {
  return {
    title: "Cleaning Surfaces Encyclopedia | Nu Standard Cleaning",
    description:
      "Explore household surfaces, their cleaning sensitivities, safe methods, compatible tools, and the problems that commonly affect them.",
    canonical: getSurfaceIndexUrl(),
    ogTitle: "Cleaning Surfaces Encyclopedia | Nu Standard Cleaning",
    ogDescription:
      "Explore household surfaces, their cleaning sensitivities, safe methods, compatible tools, and the problems that commonly affect them.",
    ogUrl: getSurfaceIndexUrl(),
    robots: "index, follow",
  };
}

export function buildSurfaceDetailMetadata(
  surfaceSlug: string,
): SurfacePageMetadata {
  const data = getSurfacePageData(surfaceSlug);

  if (!data) {
    return {
      title: "Cleaning Surface Not Found | Nu Standard Cleaning",
      description: "This cleaning surface page could not be found.",
      canonical: getSurfaceDetailUrl(surfaceSlug),
      ogTitle: "Cleaning Surface Not Found | Nu Standard Cleaning",
      ogDescription: "This cleaning surface page could not be found.",
      ogUrl: getSurfaceDetailUrl(surfaceSlug),
      robots: "noindex, nofollow",
    };
  }

  const title = buildSurfaceTitle(data.surface.name);
  const description = buildSurfaceDescription(data.surface.summary);
  const canonical = getSurfaceDetailUrl(data.surface.slug);

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
