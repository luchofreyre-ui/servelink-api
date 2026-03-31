// intentBuilder.ts

import { finalizeTitle } from "./languageEngine";

type IntentType =
  | "what-causes"
  | "how-remove"
  | "how-prevent"
  | "how-fix"
  | "how-clean";

export function buildIntent(
  intent: IntentType,
  problem: string,
  surface: string
): string {
  const baseSurface = surface.toLowerCase();
  const baseProblem = problem.toLowerCase();

  let raw = "";

  switch (intent) {
    case "what-causes":
      raw = `What causes ${baseProblem} on ${baseSurface}`;
      break;
    case "how-remove":
      raw = `How to remove ${baseProblem} from ${baseSurface}`;
      break;
    case "how-prevent":
      raw = `How to prevent ${baseProblem} on ${baseSurface}`;
      break;
    case "how-fix":
      raw = `How to fix ${baseProblem} on ${baseSurface}`;
      break;
    case "how-clean":
      raw = `How to clean ${baseProblem} from ${baseSurface}`;
      break;
  }

  return finalizeTitle(raw);
}
