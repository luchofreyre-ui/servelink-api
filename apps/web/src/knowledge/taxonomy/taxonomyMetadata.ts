import { SITE_URL } from "../../seo/seoConfig";
import {
  getTaxonomyCategoryPageData,
  getTaxonomyKindConfig,
} from "./taxonomyData";
import type { TaxonomyEntityKind } from "./taxonomyTypes";
import type { PageMetadata } from "../../seo/metadata";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildTaxonomyIndexMetadata(
  kind: TaxonomyEntityKind,
): PageMetadata {
  const config = getTaxonomyKindConfig(kind);
  const canonical = absoluteUrl(config.categoryBasePath);
  const title = `${config.title} | Nu Standard Cleaning`;

  return {
    title,
    description: config.intro,
    canonical,
    ogTitle: title,
    ogDescription: config.intro,
    ogUrl: canonical,
  };
}

export function buildTaxonomyDetailMetadata(
  kind: TaxonomyEntityKind,
  categorySlug: string,
): PageMetadata & { robots?: string } {
  const config = getTaxonomyKindConfig(kind);
  const data = getTaxonomyCategoryPageData(kind, categorySlug);

  if (!data) {
    const canonical = absoluteUrl(`${config.categoryBasePath}/${categorySlug}`);
    const title = "Category Not Found | Nu Standard Cleaning";
    const description = "The requested category could not be found.";

    return {
      title,
      description,
      canonical,
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonical,
      robots: "noindex, nofollow",
    };
  }

  const canonical = absoluteUrl(`${config.categoryBasePath}/${data.category.slug}`);
  const title = `${data.category.name} | ${config.title} | Nu Standard Cleaning`;

  return {
    title,
    description: data.category.longDescription,
    canonical,
    ogTitle: title,
    ogDescription: data.category.longDescription,
    ogUrl: canonical,
  };
}
