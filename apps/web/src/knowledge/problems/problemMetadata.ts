import { SITE_URL } from "../../seo/seoConfig";
import { getProblemPageData } from "./problemPageData";

export type ProblemPageMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  robots?: string;
};

function getProblemIndexUrl(): string {
  return `${SITE_URL}/cleaning-problems`;
}

function getProblemDetailUrl(problemSlug: string): string {
  return `${SITE_URL}/cleaning-problems/${problemSlug}`;
}

function buildProblemTitle(name: string): string {
  return `${name}: What It Is, Why It Forms, and How to Remove It | Nu Standard Cleaning`;
}

function buildProblemDescription(summary: string): string {
  return summary.length <= 160
    ? summary
    : `${summary.slice(0, 157).trim()}...`;
}

export function buildProblemIndexMetadata(): ProblemPageMetadata {
  return {
    title: "Cleaning Problems Encyclopedia | Nu Standard Cleaning",
    description:
      "Explore common household cleaning problems, what causes them, which surfaces they affect, and the safest methods for removing them.",
    canonical: getProblemIndexUrl(),
    ogTitle: "Cleaning Problems Encyclopedia | Nu Standard Cleaning",
    ogDescription:
      "Explore common household cleaning problems, what causes them, which surfaces they affect, and the safest methods for removing them.",
    ogUrl: getProblemIndexUrl(),
  };
}

export function buildProblemDetailMetadata(problemSlug: string): ProblemPageMetadata {
  const data = getProblemPageData(problemSlug);

  if (!data) {
    return {
      title: "Cleaning Problem Not Found | Nu Standard Cleaning",
      description: "The requested cleaning problem could not be found.",
      canonical: getProblemDetailUrl(problemSlug),
      ogTitle: "Cleaning Problem Not Found | Nu Standard Cleaning",
      ogDescription: "The requested cleaning problem could not be found.",
      ogUrl: getProblemDetailUrl(problemSlug),
      robots: "noindex, nofollow",
    };
  }

  const title = buildProblemTitle(data.problem.name);
  const description = buildProblemDescription(data.problem.summary);
  const canonical = getProblemDetailUrl(problemSlug);

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}
