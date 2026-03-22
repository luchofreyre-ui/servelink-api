import type { MethodPageData } from "./methodPageTypes";

type StructuredDataValue = Record<string, unknown>;

export function buildMethodIndexStructuredData(): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cleaning Methods Encyclopedia",
    description:
      "A structured encyclopedia of cleaning methods, chemistry classes, compatible surfaces, and recommended tools.",
  };
}

export function buildMethodDetailStructuredData(
  data: MethodPageData,
): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.method.name,
    description: data.method.summary,
    about: {
      "@type": "Thing",
      name: data.method.name,
      alternateName: data.method.aliases,
      description: data.method.summary,
    },
    mainEntity: {
      "@type": "DefinedTerm",
      name: data.method.name,
      description: data.method.summary,
      inDefinedTermSet: "Cleaning Methods Encyclopedia",
    },
  };
}
