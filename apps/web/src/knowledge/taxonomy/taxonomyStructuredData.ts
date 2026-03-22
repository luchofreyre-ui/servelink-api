import { SITE_URL } from "../../seo/seoConfig";
import {
  getTaxonomyCategoryIndexItems,
  getTaxonomyCategoryPageData,
  getTaxonomyKindConfig,
} from "./taxonomyData";
import type { TaxonomyEntityKind } from "./taxonomyTypes";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildTaxonomyIndexStructuredData(kind: TaxonomyEntityKind) {
  const config = getTaxonomyKindConfig(kind);
  const items = getTaxonomyCategoryIndexItems(kind);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.title,
    description: config.intro,
    url: absoluteUrl(config.categoryBasePath),
    hasPart: items.map((item) => ({
      "@type": "DefinedTerm",
      name: item.name,
      url: absoluteUrl(item.href),
      description: item.shortDescription,
    })),
  };
}

export function buildTaxonomyDetailStructuredData(
  kind: TaxonomyEntityKind,
  categorySlug: string,
) {
  const config = getTaxonomyKindConfig(kind);
  const data = getTaxonomyCategoryPageData(kind, categorySlug);

  if (!data) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Category Not Found",
      description: "The requested category could not be found.",
      url: absoluteUrl(`${config.categoryBasePath}/${categorySlug}`),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.category.name,
    description: data.category.longDescription,
    url: absoluteUrl(`${config.categoryBasePath}/${data.category.slug}`),
    hasPart: data.entities.map((entity) => ({
      "@type": "DefinedTerm",
      name: entity.name,
      url: absoluteUrl(entity.href),
      description: entity.summary ?? "",
    })),
    isPartOf: {
      "@type": "WebPage",
      name: config.title,
      url: absoluteUrl(config.categoryBasePath),
    },
  };
}
