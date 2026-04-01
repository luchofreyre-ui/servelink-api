import type { Metadata } from "next";
import { buildPublicMetadata } from "@/components/marketing/precision-luxury/content/publicContentMetadata";
import type { AuthorityCombinationPageData } from "@/authority/types/authorityCombinationTypes";
import type {
  AuthorityClusterPageData,
  AuthorityComparisonPageData,
  AuthorityGuidePageData,
  AuthorityMethodPageData,
  AuthorityProblemPageData,
  AuthoritySurfacePageData,
} from "@/authority/types/authorityPageTypes";
import type { AuthorityPageFamily } from "@/authority/types/authoritySeoTypes";
import {
  getClusterDetailCanonicalPath,
  getClustersCanonicalPath,
  getComparisonCanonicalPath,
  getEncyclopediaCanonicalPath,
  getGuideDetailCanonicalPath,
  getGuidesIndexCanonicalPath,
  getMethodComboCanonicalPath,
  getMethodDetailCanonicalPath,
  getMethodsIndexCanonicalPath,
  getProblemDetailCanonicalPath,
  getProblemsIndexCanonicalPath,
  getSurfaceDetailCanonicalPath,
  getSurfaceProblemComboCanonicalPath,
  getSurfacesIndexCanonicalPath,
  getCompareHubCanonicalPath,
} from "./authorityCanonicalPaths";
import { buildAuthoritySeoPolicy } from "./authoritySeoPolicy";

function authorityPublicMetadata(
  family: AuthorityPageFamily,
  canonicalPath: string,
  opts: { title: string; description: string; type?: "website" | "article" },
): Metadata {
  const policy = buildAuthoritySeoPolicy(family, canonicalPath);
  return buildPublicMetadata({
    title: opts.title,
    description: opts.description,
    pathname: policy.canonicalPath,
    type: opts.type ?? "article",
    allowSearchIndexing: policy.shouldIndex,
  });
}

export function buildAuthorityMethodsIndexMetadata(): Metadata {
  return authorityPublicMetadata("methods_index", getMethodsIndexCanonicalPath(), {
    title: "Cleaning Methods",
    description:
      "Educational overviews of core cleaning methods—where they work, why they work, common mistakes, and when to stop.",
    type: "website",
  });
}

export function buildAuthoritySurfacesIndexMetadata(): Metadata {
  return authorityPublicMetadata("surfaces_index", getSurfacesIndexCanonicalPath(), {
    title: "Surface Cleaning Guides",
    description:
      "Surface-by-surface guidance for safer home cleaning: what to know first, compatible methods, and when to escalate.",
    type: "website",
  });
}

export function buildAuthorityProblemsIndexMetadata(): Metadata {
  return authorityPublicMetadata("problems_index", getProblemsIndexCanonicalPath(), {
    title: "Cleaning Problems and How to Handle Them",
    description:
      "Learn what common cleaning problems usually are, why they happen, which methods fit best, and when to avoid making them worse.",
    type: "website",
  });
}

export function buildAuthorityMethodDetailMetadata(page: AuthorityMethodPageData): Metadata {
  const title = `${page.title}: Where It Works, Where It Fails, and What to Avoid`;
  return authorityPublicMetadata(
    "method_detail",
    getMethodDetailCanonicalPath(page.slug),
    {
      title,
      description: page.summary,
    },
  );
}

export function buildAuthoritySurfaceDetailMetadata(page: AuthoritySurfacePageData): Metadata {
  const title = `How to Clean ${page.title} Safely`;
  return authorityPublicMetadata(
    "surface_detail",
    getSurfaceDetailCanonicalPath(page.slug),
    {
      title,
      description: page.summary,
    },
  );
}

export function buildAuthorityGuideDetailMetadata(page: AuthorityGuidePageData): Metadata {
  return authorityPublicMetadata("guide_detail", getGuideDetailCanonicalPath(page.slug), {
    title: page.title,
    description: page.description ?? page.summary,
  });
}

export function buildAuthorityProblemDetailMetadata(page: AuthorityProblemPageData): Metadata {
  const title = `${page.title}: Best Approaches, Common Mistakes, and What to Avoid`;
  return authorityPublicMetadata(
    "problem_detail",
    getProblemDetailCanonicalPath(page.slug),
    {
      title,
      description: page.description ?? page.summary,
    },
  );
}

export function buildAuthorityMethodComboMetadata(
  data: AuthorityCombinationPageData,
  methodSlug: string,
  comboSlug: string,
): Metadata {
  return authorityPublicMetadata(
    "method_combo",
    getMethodComboCanonicalPath(methodSlug, comboSlug),
    {
      title: data.title,
      description: data.description,
    },
  );
}

export function buildAuthoritySurfaceProblemMetadata(
  data: AuthorityCombinationPageData,
  surfaceSlug: string,
  problemSlug: string,
): Metadata {
  return authorityPublicMetadata(
    "surface_problem_combo",
    getSurfaceProblemComboCanonicalPath(surfaceSlug, problemSlug),
    {
      title: data.title,
      description: data.description,
    },
  );
}

export function buildAuthorityEncyclopediaMetadata(): Metadata {
  return authorityPublicMetadata("encyclopedia_index", getEncyclopediaCanonicalPath(), {
    title: "Cleaning Encyclopedia",
    description:
      "Structured methods, surfaces, problems, and guides for safer home cleaning—deterministic playbooks without generic tips.",
    type: "website",
  });
}

export function buildAuthorityGuidesIndexMetadata(): Metadata {
  return authorityPublicMetadata("guides_index", getGuidesIndexCanonicalPath(), {
    title: "Cleaning Guides",
    description: "Consolidated guides on stains, failures, surface protection, and chemical safety.",
    type: "website",
  });
}

export function buildAuthorityCompareMethodsIndexMetadata(): Metadata {
  return authorityPublicMetadata("compare_index", getCompareHubCanonicalPath("methods"), {
    title: "Compare Cleaning Methods",
    description:
      "Structured, taxonomy-backed comparisons of cleaning methods—roles, graph links, and where each method fits.",
    type: "website",
  });
}

export function buildAuthorityCompareSurfacesIndexMetadata(): Metadata {
  return authorityPublicMetadata("compare_index", getCompareHubCanonicalPath("surfaces"), {
    title: "Compare Surfaces",
    description:
      "Side-by-side surface comparisons: linked methods, common problems, and finish-risk context from the cleaning graph.",
    type: "website",
  });
}

export function buildAuthorityCompareProblemsIndexMetadata(): Metadata {
  return authorityPublicMetadata("compare_index", getCompareHubCanonicalPath("problems"), {
    title: "Compare Cleaning Problems",
    description:
      "Compare common cleaning problems by category, symptoms, and graph-linked methods and surfaces.",
    type: "website",
  });
}

export function buildAuthorityCompareProductsIndexMetadata(): Metadata {
  return authorityPublicMetadata("compare_index", getCompareHubCanonicalPath("products"), {
    title: "Compare Cleaning Products",
    description:
      "Side-by-side cleaning product comparisons: chemistry, dossier strengths, avoid cases, and safety notes from the Servelink library.",
    type: "website",
  });
}

export function buildAuthorityMethodComparisonDetailMetadata(page: AuthorityComparisonPageData): Metadata {
  return authorityPublicMetadata(
    "method_compare_detail",
    getComparisonCanonicalPath("methods", page.slug),
    {
      title: page.title,
      description: page.description,
    },
  );
}

export function buildAuthoritySurfaceComparisonDetailMetadata(page: AuthorityComparisonPageData): Metadata {
  return authorityPublicMetadata(
    "surface_compare_detail",
    getComparisonCanonicalPath("surfaces", page.slug),
    {
      title: page.title,
      description: page.description,
    },
  );
}

export function buildAuthorityProblemComparisonDetailMetadata(page: AuthorityComparisonPageData): Metadata {
  return authorityPublicMetadata(
    "problem_compare_detail",
    getComparisonCanonicalPath("problems", page.slug),
    {
      title: page.title,
      description: page.description,
    },
  );
}

export function buildAuthorityProductComparisonDetailMetadata(page: AuthorityComparisonPageData): Metadata {
  return authorityPublicMetadata(
    "product_compare_detail",
    getComparisonCanonicalPath("products", page.slug),
    {
      title: page.title,
      description: page.description,
    },
  );
}

export function buildAuthorityClustersIndexMetadata(): Metadata {
  return authorityPublicMetadata("clusters_index", getClustersCanonicalPath(), {
    title: "Topic Clusters",
    description:
      "Structured topic hubs grouping related cleaning problems, methods, surfaces, and guides from the authority graph.",
    type: "website",
  });
}

export function buildAuthorityClusterDetailMetadata(page: AuthorityClusterPageData): Metadata {
  return authorityPublicMetadata("cluster_detail", getClusterDetailCanonicalPath(page.slug), {
    title: page.title,
    description: page.description,
  });
}
