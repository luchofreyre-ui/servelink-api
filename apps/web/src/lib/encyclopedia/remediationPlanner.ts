// remediationPlanner.ts

import type { ReviewablePage } from "./renderTypes";
import type {
  PageRemediationPlan,
  RemediationSuggestion,
} from "./remediationTypes";

function suggestion(
  type: RemediationSuggestion["type"],
  title: string,
  description: string,
  priority: RemediationSuggestion["priority"],
  sourceReason?: RemediationSuggestion["sourceReason"]
): RemediationSuggestion {
  return {
    type,
    title,
    description,
    priority,
    sourceReason,
  };
}

export function buildRemediationPlan(
  page: ReviewablePage
): PageRemediationPlan {
  const reasons = page.publishFailureReasons ?? [];
  const suggestions: RemediationSuggestion[] = [];

  for (const reason of reasons) {
    switch (reason) {
      case "quality-too-low":
        suggestions.push(
          suggestion(
            "expand-depth",
            "Expand page depth",
            "Increase explanatory detail, add sharper problem distinctions, and improve clarity in the fix workflow.",
            "high",
            reason
          )
        );
        break;

      case "evidence-too-thin":
        suggestions.push(
          suggestion(
            "add-evidence",
            "Add targeted evidence",
            "Attach more problem-specific or material-specific evidence so the page has stronger support.",
            "high",
            reason
          )
        );
        break;

      case "internal-links-too-thin":
        suggestions.push(
          suggestion(
            "add-internal-links",
            "Add stronger internal links",
            "Connect this page to more same-problem, same-surface, or related-problem pages to improve authority coverage.",
            "medium",
            reason
          )
        );
        break;

      case "missing-rationale":
        suggestions.push(
          suggestion(
            "strengthen-rationale",
            "Add chemical and tool rationale",
            "Explain why the selected chemical and tool are appropriate for this soil and surface combination.",
            "high",
            reason
          )
        );
        break;

      case "missing-evidence":
        suggestions.push(
          suggestion(
            "add-evidence",
            "Attach evidence bundle",
            "This page needs at least one relevant evidence item before it should move forward.",
            "high",
            reason
          )
        );
        break;

      case "missing-sections":
        suggestions.push(
          suggestion(
            "expand-depth",
            "Restore required sections",
            "The page must contain all required sections before it can pass policy.",
            "high",
            reason
          )
        );
        break;

      case "high-risk-needs-stronger-evidence":
        suggestions.push(
          suggestion(
            "review-high-risk-support",
            "Strengthen support for high-risk page",
            "High-risk pages need stronger evidence coverage and tighter safety framing before approval.",
            "high",
            reason
          )
        );
        break;

      case "force-fail-override":
        break;
    }
  }

  if ((page.qualityScore?.titleStrength ?? 0) < 70) {
    suggestions.push(
      suggestion(
        "rewrite-title",
        "Improve title strength",
        "Rewrite the title to be more specific, clearer, and stronger for the user’s intent.",
        "medium"
      )
    );
  }

  return {
    slug: page.slug,
    title: page.title,
    passedPolicy: Boolean(page.publishPolicyPassed),
    reasons,
    suggestions: dedupeSuggestions(suggestions),
  };
}

function dedupeSuggestions(
  suggestions: RemediationSuggestion[]
): RemediationSuggestion[] {
  const seen = new Set<string>();
  const result: RemediationSuggestion[] = [];

  for (const item of suggestions) {
    const key = `${item.type}::${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result.sort((a, b) => {
    const priorityRank = { high: 0, medium: 1, low: 2 };
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}
