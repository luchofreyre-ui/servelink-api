import { getValidationInsights } from "../review/reviewInsights.server";

function guidanceForError(message: string): string {
  if (message.includes("section")) {
    return "Ensure all 6 canonical sections exist";
  }
  if (message.includes("internalLinks")) {
    return "Add at least 2 valid internal links";
  }
  if (message.includes("body")) {
    return "Expand section body content beyond minimum length";
  }
  return "General validation failure";
}

export function buildGenerationFeedback() {
  const insights = getValidationInsights();

  return {
    criticalFailures: insights.topErrors.slice(0, 5),
    guidance: insights.topErrors.map((e) => guidanceForError(e.error)),
  };
}
