import { getAuthorityDensityBridge } from "@/authority/data/authorityDensityBridgeSelectors";
import {
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getSurfaceProblemEdge,
} from "@/authority/data/authorityGraphSelectors";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  resolveAuthoritySolutionServiceEscalation,
  roleForRecommendedProduct,
} from "@/authority/data/authoritySolutionRules";
import type {
  AuthoritySolutionChemical,
  AuthoritySolutionProduct,
  AuthoritySolutionProfile,
  AuthoritySolutionTool,
  AuthoritySolutionWarnings,
  AuthoritySolutionWorkflow,
} from "@/authority/types/authoritySolutionTypes";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import { getRecommendedProductsForDisplay } from "@/lib/products/productRecommendationDensity";
import { resolveProductRecommendationContextForSurfaceProblemPage } from "@/lib/products/productRecommendationContext";
import { assignRecommendationRoleLabels } from "@/lib/products/recommendationRoles";

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function commonMethodSlugs(surfaceSlug: string, problemSlug: string): string[] {
  const surfaceMethods = new Set(getMethodSlugsForSurface(surfaceSlug));
  return getMethodSlugsForProblem(problemSlug).filter((methodSlug) => surfaceMethods.has(methodSlug));
}

function buildWorkflow(bridge: ReturnType<typeof getAuthorityDensityBridge>): AuthoritySolutionWorkflow {
  const primary = bridge.workflowProfiles[0] ?? null;
  return {
    primaryWorkflowSlug: primary?.slug ?? null,
    family: primary?.workflowFamily ?? null,
    actionSequence: primary?.sequenceLogic.map((phase) => phase.phase) ?? [],
    safetyRules: primary?.safetyLogic.map((rule) => rule.rule) ?? [],
    escalationTriggers: primary?.escalationLogic.map((trigger) => trigger.trigger) ?? [],
  };
}

function buildTools(args: {
  bridge: ReturnType<typeof getAuthorityDensityBridge>;
  surfaceSlug: string;
  problemSlug: string;
}): AuthoritySolutionTool[] {
  const tools: AuthoritySolutionTool[] = [];
  const primary = args.bridge.workflowProfiles[0] ?? null;

  for (const tool of primary?.requiredToolRoles ?? []) {
    tools.push({
      name: tool.role,
      role: "required",
      reason: tool.logic,
      source: "workflow",
    });
  }

  const methodSlugs = [
    ...(primary?.supportingMethodSlugs ?? []),
    ...commonMethodSlugs(args.surfaceSlug, args.problemSlug),
  ];
  for (const methodSlug of methodSlugs) {
    const method = getMethodPageBySlug(methodSlug);
    for (const tool of method?.recommendedTools ?? []) {
      tools.push({
        name: tool.name,
        role: "recommended",
        reason: tool.note ?? method?.title ?? methodSlug,
        source: "method",
      });
    }
  }

  for (const tool of args.bridge.problemScience ? getProblemPageBySlug(args.problemSlug)?.recommendedTools ?? [] : []) {
    tools.push({
      name: tool.name,
      role: "optional",
      reason: tool.note ?? "Recommended by the problem guide.",
      source: "problem",
    });
  }

  for (const tool of args.bridge.surfaceScience ? getSurfacePageBySlug(args.surfaceSlug)?.recommendedTools ?? [] : []) {
    tools.push({
      name: tool.name,
      role: "optional",
      reason: tool.note ?? "Recommended by the surface guide.",
      source: "surface",
    });
  }

  return uniqueBy(tools, (tool) => `${tool.name.toLowerCase()}::${tool.role}`);
}

function buildChemicals(args: {
  bridge: ReturnType<typeof getAuthorityDensityBridge>;
  surfaceSlug: string;
  problemSlug: string;
}): AuthoritySolutionChemical[] {
  const chemicals: AuthoritySolutionChemical[] = [];
  const primary = args.bridge.workflowProfiles[0] ?? null;

  if (primary?.chemicalLogic.chemistryClass) {
    chemicals.push({
      name: primary.chemicalLogic.chemistryClass,
      role: "targeted",
      reason: primary.chemicalLogic.soilFit,
      source: "workflow",
    });
  }

  const methodSlugs = [
    ...(primary?.supportingMethodSlugs ?? []),
    ...commonMethodSlugs(args.surfaceSlug, args.problemSlug),
  ];
  for (const methodSlug of methodSlugs) {
    const method = getMethodPageBySlug(methodSlug);
    for (const chemical of method?.recommendedChemicals ?? []) {
      chemicals.push({
        name: chemical.name,
        role: "targeted",
        reason: chemical.note ?? method?.title ?? methodSlug,
        source: "method",
      });
    }
  }

  for (const chemical of getProblemPageBySlug(args.problemSlug)?.recommendedChemicals ?? []) {
    chemicals.push({
      name: chemical.name,
      role: "targeted",
      reason: chemical.note ?? "Recommended by the problem guide.",
      source: "problem",
    });
  }

  for (const chemical of getSurfacePageBySlug(args.surfaceSlug)?.recommendedChemicals ?? []) {
    chemicals.push({
      name: chemical.name,
      role: "starter",
      reason: chemical.note ?? "Recommended by the surface guide.",
      source: "surface",
    });
  }

  for (const sensitive of args.bridge.surfaceScience?.chemicalSensitivity.sensitiveTo ?? []) {
    chemicals.push({
      name: sensitive,
      role: "do_not_use",
      reason: args.bridge.surfaceScience?.chemicalSensitivity.controlStrategy ?? "Surface sensitivity warning.",
      source: "surface",
    });
  }

  return uniqueBy(chemicals, (chemical) => `${chemical.name.toLowerCase()}::${chemical.role}`);
}

function reasonForProductRole(product: AuthoritySolutionProduct): string {
  switch (product.role) {
    case "best_option":
      return "Best balanced fit for this problem and surface.";
    case "alternative":
      return "Alternative option for heavier or different buildup patterns.";
    case "maintenance":
      return "Maintenance option for recurrence control.";
    case "professional_only":
      return "Professional-strength complement; use only when the surface and label support it.";
    case "do_not_use":
      return "Not compatible with this authority solution.";
  }
}

function buildProducts(surfaceSlug: string, problemSlug: string): AuthoritySolutionProduct[] {
  const context = resolveProductRecommendationContextForSurfaceProblemPage(surfaceSlug, problemSlug);
  if (!context?.surface) return [];

  const recommended = getRecommendedProductsForDisplay({
    problem: context.problem,
    surface: context.surface,
    intent: context.intent,
    densityAuthorityProblemSlug: context.densityAuthorityProblemSlug,
  });
  const roles = assignRecommendationRoleLabels(recommended, context.surface);

  return recommended.map((product) => {
    const published = getPublishedProductBySlug(product.slug);
    const purchaseHref = getProductPurchaseUrl(product.slug);
    const solutionProduct: AuthoritySolutionProduct = {
      slug: product.slug,
      title: published?.title ?? product.title ?? product.slug,
      role: roleForRecommendedProduct({ slug: product.slug, ...roles }),
      reason: published?.heroVerdict ?? "",
      purchaseHref: purchaseHref === "#" ? null : purchaseHref,
    };
    return {
      ...solutionProduct,
      reason: solutionProduct.reason || reasonForProductRole(solutionProduct),
    };
  });
}

function buildWarnings(bridge: ReturnType<typeof getAuthorityDensityBridge>): AuthoritySolutionWarnings {
  const stopConditions = uniqueBy(
    [
      ...bridge.visualProfiles.map((profile) => profile.stopCondition).filter(Boolean),
      ...(bridge.problemScience?.remediationLadder.map((step) => step.stopCondition) ?? []),
      ...(bridge.surfaceScience?.restorationBoundary.escalationSignals ?? []),
    ],
    (warning) => warning,
  );
  const doNotUse = uniqueBy(
    [
      ...(bridge.surfaceScience?.chemicalSensitivity.sensitiveTo.map((item) => `Avoid ${item} unless the label and surface test allow it.`) ?? []),
    ],
    (warning) => warning,
  );
  const compatibilityNotes = uniqueBy(
    [
      ...bridge.compatibilityWarnings.map((warning) => warning.message),
      bridge.surfaceScience?.chemicalSensitivity.controlStrategy,
      bridge.surfaceScience?.moistureTolerance.controlStrategy,
      bridge.surfaceScience?.abrasionTolerance.controlStrategy,
    ].filter((note): note is string => Boolean(note)),
    (note) => note,
  );

  return {
    stopConditions,
    doNotUse,
    compatibilityNotes,
  };
}

export function resolveAuthoritySolutionProfile(args: {
  surfaceSlug: string;
  problemSlug: string;
}): AuthoritySolutionProfile {
  const bridge = getAuthorityDensityBridge(args);
  const graphEdge = getSurfaceProblemEdge(args.surfaceSlug, args.problemSlug);

  return {
    problemSlug: args.problemSlug,
    surfaceSlug: args.surfaceSlug,
    workflow: buildWorkflow(bridge),
    tools: buildTools({ bridge, surfaceSlug: args.surfaceSlug, problemSlug: args.problemSlug }),
    chemicals: buildChemicals({ bridge, surfaceSlug: args.surfaceSlug, problemSlug: args.problemSlug }),
    products: buildProducts(args.surfaceSlug, args.problemSlug),
    serviceEscalation: resolveAuthoritySolutionServiceEscalation({
      bridge,
      graphDisposition: graphEdge?.disposition ?? null,
    }),
    warnings: buildWarnings(bridge),
  };
}
