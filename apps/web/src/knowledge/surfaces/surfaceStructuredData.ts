import type { SurfacePageData } from "./surfacePageTypes";

type StructuredDataValue = Record<string, unknown>;

export function buildSurfaceIndexStructuredData(): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cleaning Surfaces Encyclopedia",
    description:
      "A structured encyclopedia of household surfaces, their cleaning sensitivities, compatible methods, and common cleaning problems.",
  };
}

export function buildSurfaceDetailStructuredData(
  data: SurfacePageData,
): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.surface.name,
    description: data.surface.summary,
    about: {
      "@type": "Thing",
      name: data.surface.name,
      alternateName: data.surface.aliases,
      description: data.surface.summary,
    },
    mainEntity: {
      "@type": "DefinedTerm",
      name: data.surface.name,
      description: data.surface.summary,
      inDefinedTermSet: "Cleaning Surfaces Encyclopedia",
    },
  };
}
