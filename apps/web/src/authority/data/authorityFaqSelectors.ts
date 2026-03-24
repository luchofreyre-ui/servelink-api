import {
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
} from "./authorityGraphSelectors";
import { getGuidePageBySlug } from "./authorityGuidePageData";
import { getMethodPageBySlug } from "./authorityMethodPageData";
import { getProblemPageBySlug } from "./authorityProblemPageData";
import { getSurfacePageBySlug } from "./authoritySurfacePageData";
import type { AuthorityFaqBlock, AuthorityProblemCategory } from "../types/authorityPageTypes";

function uniqueByQuestion(items: { question: string; answer: string }[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.question)) return false;
    seen.add(item.question);
    return true;
  });
}

function categoryLabel(category: AuthorityProblemCategory): string {
  switch (category) {
    case "oil_based":
      return "oil-based residue";
    case "mineral":
      return "mineral buildup";
    case "residue":
      return "residue-related issues";
    case "biological":
      return "biological contamination";
    case "physical_damage":
      return "surface-damage risk";
    case "transfer":
      return "transfer-related marks";
    case "organic":
      return "organic buildup";
    default:
      return "cleaning problems";
  }
}

export function buildMethodFaqBlock(methodSlug: string): AuthorityFaqBlock | null {
  const method = getMethodPageBySlug(methodSlug);
  if (!method) return null;

  const linkedSurfaces = getSurfaceSlugsForMethod(methodSlug)
    .map((slug) => getSurfacePageBySlug(slug))
    .filter(Boolean);
  const linkedProblems = getProblemSlugsForMethod(methodSlug)
    .map((slug) => getProblemPageBySlug(slug))
    .filter(Boolean);

  const items = uniqueByQuestion([
    {
      question: `When is ${method.title.toLowerCase()} usually used?`,
      answer: `${method.title} is usually used when the surface and contamination type match the method's intended cleaning role. It should be chosen based on compatibility, soil type, and finish risk rather than strength alone.`,
    },
    ...(linkedSurfaces[0]
      ? [
          {
            question: `Can ${method.title.toLowerCase()} be used on ${linkedSurfaces[0]!.title.toLowerCase()}?`,
            answer: `${method.title} can be considered for ${linkedSurfaces[0]!.title.toLowerCase()} when the graph marks that relationship as valid. Surface sensitivity and finish risk still need to be checked before escalation.`,
          },
        ]
      : []),
    ...(linkedProblems[0]
      ? [
          {
            question: `Does ${method.title.toLowerCase()} help with ${linkedProblems[0]!.title.toLowerCase()}?`,
            answer: `${method.title} may be used for ${linkedProblems[0]!.title.toLowerCase()} when that method-problem relationship exists in the cleaning graph. Success depends on severity, surface compatibility, and residue control.`,
          },
        ]
      : []),
    {
      question: `What causes ${method.title.toLowerCase()} to fail?`,
      answer: `${method.title} usually fails when the contamination type is misidentified, the surface cannot tolerate the method safely, or finish and residue control are handled poorly.`,
    },
  ]);

  return items.length ? { title: "Method FAQ", items: items.slice(0, 4) } : null;
}

export function buildSurfaceFaqBlock(surfaceSlug: string): AuthorityFaqBlock | null {
  const surface = getSurfacePageBySlug(surfaceSlug);
  if (!surface) return null;

  const linkedMethods = getMethodSlugsForSurface(surfaceSlug)
    .map((slug) => getMethodPageBySlug(slug))
    .filter(Boolean);
  const linkedProblems = getProblemSlugsForSurface(surfaceSlug)
    .map((slug) => getProblemPageBySlug(slug))
    .filter(Boolean);

  const items = uniqueByQuestion([
    {
      question: `What makes ${surface.title.toLowerCase()} harder to clean safely?`,
      answer: `${surface.title} becomes harder to clean safely when the finish is sensitive to abrasion, chemistry, moisture, or repeated aggressive maintenance.`,
    },
    ...(linkedProblems[0]
      ? [
          {
            question: `What problems commonly show up on ${surface.title.toLowerCase()}?`,
            answer: `${linkedProblems[0]!.title} is one of the common issues linked to ${surface.title.toLowerCase()} in the authority graph, but the right response still depends on severity and finish condition.`,
          },
        ]
      : []),
    ...(linkedMethods[0]
      ? [
          {
            question: `Which method is often used on ${surface.title.toLowerCase()}?`,
            answer: `${linkedMethods[0]!.title} is one of the methods linked to ${surface.title.toLowerCase()} in the graph. The goal is to match method strength to both contamination and surface tolerance.`,
          },
        ]
      : []),
    {
      question: `How do you reduce damage risk on ${surface.title.toLowerCase()}?`,
      answer: `Damage risk is reduced by using the least aggressive effective method, controlling dwell time and moisture, and separating contamination removal from finish preservation.`,
    },
  ]);

  return items.length ? { title: "Surface FAQ", items: items.slice(0, 4) } : null;
}

export function buildProblemFaqBlock(problemSlug: string): AuthorityFaqBlock | null {
  const problem = getProblemPageBySlug(problemSlug);
  if (!problem) return null;

  const linkedMethods = getMethodSlugsForProblem(problemSlug)
    .map((slug) => getMethodPageBySlug(slug))
    .filter(Boolean);
  const linkedSurfaces = getSurfaceSlugsForProblem(problemSlug)
    .map((slug) => getSurfacePageBySlug(slug))
    .filter(Boolean);

  const items = uniqueByQuestion([
    {
      question: `What kind of problem is ${problem.title.toLowerCase()}?`,
      answer: `${problem.title} is treated as ${categoryLabel(problem.category)} in the authority system, which helps determine how it should be approached and what risks matter most.`,
    },
    ...(linkedSurfaces[0]
      ? [
          {
            question: `Where does ${problem.title.toLowerCase()} usually appear?`,
            answer: `${problem.title} is linked in the graph to surfaces such as ${linkedSurfaces[0]!.title.toLowerCase()}, although the exact pattern depends on use, moisture, chemistry, and maintenance history.`,
          },
        ]
      : []),
    ...(linkedMethods[0]
      ? [
          {
            question: `What method is often used for ${problem.title.toLowerCase()}?`,
            answer: `${linkedMethods[0]!.title} is one of the methods connected to ${problem.title.toLowerCase()} in the cleaning graph. The correct choice still depends on surface compatibility and severity.`,
          },
        ]
      : []),
    {
      question: `Why does ${problem.title.toLowerCase()} come back after cleaning?`,
      answer: `${problem.title} often returns when the contamination type was misread, the surface was not fully finished, residue was left behind, or the underlying source of the problem was not addressed.`,
    },
  ]);

  return items.length ? { title: "Problem FAQ", items: items.slice(0, 4) } : null;
}

export function buildGuideFaqBlock(guideSlug: string): AuthorityFaqBlock | null {
  const guide = getGuidePageBySlug(guideSlug);
  if (!guide) return null;

  const firstRelatedProblemSlug = guide.relatedProblems?.[0]?.slug;
  const firstRelatedProblemTitle = firstRelatedProblemSlug
    ? getProblemPageBySlug(firstRelatedProblemSlug)?.title.toLowerCase()
    : null;

  const items = uniqueByQuestion([
    {
      question: `Who is this guide for?`,
      answer: `${guide.title} is for readers trying to understand how cleaning methods, surface risks, and contamination types connect in a structured way.`,
    },
    {
      question: `Does this guide replace surface- or problem-specific guidance?`,
      answer: `No. ${guide.title} is a higher-level guide. Specific method, surface, and problem pages provide more targeted guidance when a relationship is known.`,
    },
    ...(firstRelatedProblemSlug
      ? [
          {
            question: `What kinds of problems does this guide relate to?`,
            answer: `This guide connects to problems such as ${firstRelatedProblemTitle ?? "cleaning issues"}, based on the authority graph and guide taxonomy.`,
          },
        ]
      : []),
    {
      question: `Why is structured guidance important here?`,
      answer: `Structured guidance reduces the chance of treating the wrong problem, using the wrong method, or damaging the surface while trying to improve it.`,
    },
  ]);

  return items.length ? { title: "Guide FAQ", items: items.slice(0, 4) } : null;
}

export function buildMethodComboFaqBlock(
  methodSlug: string,
  comboSlug: string,
): AuthorityFaqBlock | null {
  const method = getMethodPageBySlug(methodSlug);
  const surface = getSurfacePageBySlug(comboSlug);
  const problem = getProblemPageBySlug(comboSlug);

  if (!method) return null;

  if (surface) {
    return {
      title: "Playbook FAQ",
      items: [
        {
          question: `Why use ${method.title.toLowerCase()} on ${surface.title.toLowerCase()}?`,
          answer: `${method.title} is linked to ${surface.title.toLowerCase()} in the graph because the method can fit that surface under the right conditions. The key is controlling risk while matching the contamination type.`,
        },
        {
          question: `What is the main risk when using ${method.title.toLowerCase()} on ${surface.title.toLowerCase()}?`,
          answer: `The main risk is using a valid method without adjusting for finish sensitivity, moisture tolerance, or residue control requirements.`,
        },
        {
          question: `Should stronger chemistry be the first step here?`,
          answer: `No. A structured playbook starts with the least aggressive effective option and escalates only when the surface and contamination pattern justify it.`,
        },
      ],
    };
  }

  if (problem) {
    return {
      title: "Playbook FAQ",
      items: [
        {
          question: `Why use ${method.title.toLowerCase()} for ${problem.title.toLowerCase()}?`,
          answer: `${method.title} is connected to ${problem.title.toLowerCase()} in the graph because it can address that problem type in the right context. Surface compatibility still determines whether it is actually appropriate.`,
        },
        {
          question: `What makes this playbook fail?`,
          answer: `This playbook usually fails when the visible problem is misidentified, the surface cannot tolerate the method safely, or the finish step leaves behind residue or unevenness.`,
        },
        {
          question: `Does this playbook apply to every surface?`,
          answer: `No. A method-problem relationship does not automatically mean every surface is a safe fit. The surface layer still controls the risk profile.`,
        },
      ],
    };
  }

  return null;
}

export function buildSurfaceProblemFaqBlock(
  surfaceSlug: string,
  problemSlug: string,
): AuthorityFaqBlock | null {
  const surface = getSurfacePageBySlug(surfaceSlug);
  const problem = getProblemPageBySlug(problemSlug);

  if (!surface || !problem) return null;

  return {
    title: "Playbook FAQ",
    items: [
      {
        question: `Why does ${problem.title.toLowerCase()} show up on ${surface.title.toLowerCase()}?`,
        answer: `${problem.title} appears on ${surface.title.toLowerCase()} when the surface conditions, environment, or maintenance pattern allow that problem type to develop or remain visible.`,
      },
      {
        question: `What is the biggest mistake when treating ${problem.title.toLowerCase()} on ${surface.title.toLowerCase()}?`,
        answer: `The biggest mistake is treating the visible issue without checking whether the surface is sensitive to the chemistry, abrasion, or moisture involved in removal.`,
      },
      {
        question: `What should the cleaning process protect here?`,
        answer: `The process should protect the finish, control residue, and avoid turning a contamination problem into a surface-damage problem.`,
      },
    ],
  };
}
