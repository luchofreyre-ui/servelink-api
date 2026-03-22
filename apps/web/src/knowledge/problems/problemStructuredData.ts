import type { ProblemPageData } from "./problemPageTypes";

type StructuredDataValue = Record<string, unknown>;

export function buildProblemIndexStructuredData(): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cleaning Problems Encyclopedia",
    description:
      "A structured encyclopedia of common residential cleaning problems, their causes, affected surfaces, and safe removal methods.",
  };
}

export function buildProblemDetailStructuredData(
  data: ProblemPageData,
): StructuredDataValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.problem.name,
    description: data.problem.summary,
    about: {
      "@type": "Thing",
      name: data.problem.name,
      alternateName: data.problem.aliases,
      description: data.problem.summary,
    },
    mainEntity: {
      "@type": "DefinedTerm",
      name: data.problem.name,
      description: data.problem.summary,
      inDefinedTermSet: "Cleaning Problems Encyclopedia",
    },
  };
}
