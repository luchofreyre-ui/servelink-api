import type { ToolPageData } from "./toolPageTypes";

type StructuredDataValue = Record<string, unknown>;

export function buildToolIndexStructuredData(): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cleaning Tools Encyclopedia",
    description:
      "A structured encyclopedia of cleaning tools, their best uses, compatible surfaces, and safe handling guidance.",
  };
}

export function buildToolDetailStructuredData(
  data: ToolPageData,
): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.tool.name,
    description: data.tool.summary,
    about: {
      "@type": "Thing",
      name: data.tool.name,
      alternateName: data.tool.aliases,
      description: data.tool.summary,
    },
    mainEntity: {
      "@type": "DefinedTerm",
      name: data.tool.name,
      description: data.tool.summary,
      inDefinedTermSet: "Cleaning Tools Encyclopedia",
    },
  };
}
