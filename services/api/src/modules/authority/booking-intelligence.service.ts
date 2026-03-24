import { Injectable } from "@nestjs/common";
import { AUTHORITY_SNAPSHOT } from "./authority.snapshot";
import {
  BookingAuthorityInput,
  BookingAuthorityTagResult,
} from "./booking-intelligence.types";

type KeywordMap = Record<string, string[]>;

const SURFACE_KEYWORDS: KeywordMap = {
  tile: ["tile", "grout", "backsplash"],
  "vinyl-flooring": ["vinyl", "lvp", "flooring"],
  "painted-walls": ["wall", "painted wall", "baseboard area"],
  "stainless-steel": ["stainless", "appliance", "fridge", "range hood"],
  "shower-glass": ["shower glass", "glass door", "glass shower"],
  "granite-countertops": ["granite", "countertop", "counter"],
};

const PROBLEM_KEYWORDS: KeywordMap = {
  "grease-buildup": ["grease", "greasy", "kitchen buildup", "oil buildup"],
  "stuck-on-residue": ["stuck on", "caked on", "adhered residue"],
  "hard-water-deposits": ["hard water", "mineral deposit", "water spot"],
  limescale: ["limescale", "scale buildup"],
  "soap-scum": ["soap scum", "soap film", "bath residue"],
  "touchpoint-contamination": ["touchpoint", "high touch", "disinfect", "sanitize"],
  "dust-buildup": ["dust", "dusty"],
  "light-mildew": ["mildew", "mold spot"],
  "general-soil": ["dirty", "soil", "soiling"],
  smudging: ["smudge", "fingerprint", "streak"],
};

function normalizeText(input: BookingAuthorityInput): string {
  return [
    input.serviceType ?? "",
    input.notes ?? "",
    input.addressLine1 ?? "",
    JSON.stringify(input.metadata ?? {}),
  ]
    .join(" ")
    .toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

@Injectable()
export class BookingIntelligenceService {
  resolveTags(input: BookingAuthorityInput): BookingAuthorityTagResult {
    const text = normalizeText(input);

    const surfaces = Object.entries(SURFACE_KEYWORDS)
      .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
      .map(([slug]) => slug);

    const directProblems = Object.entries(PROBLEM_KEYWORDS)
      .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
      .map(([slug]) => slug);

    const impliedProblems = surfaces.flatMap(
      (surfaceSlug) => AUTHORITY_SNAPSHOT.surfaceToProblems[surfaceSlug] ?? []
    );

    const problems = uniqueSorted([...directProblems, ...impliedProblems]);

    const methods = uniqueSorted(
      Object.entries(AUTHORITY_SNAPSHOT.methodToProblems)
        .filter(([, problemSlugs]) =>
          problemSlugs.some((problemSlug) => problems.includes(problemSlug))
        )
        .map(([methodSlug]) => methodSlug)
    );

    const reasons: string[] = [];

    for (const surface of surfaces) {
      reasons.push(`surface:${surface}:matched-keyword`);
    }

    for (const problem of directProblems) {
      reasons.push(`problem:${problem}:matched-keyword`);
    }

    for (const surface of surfaces) {
      for (const problem of AUTHORITY_SNAPSHOT.surfaceToProblems[surface] ?? []) {
        if (problems.includes(problem)) {
          reasons.push(`problem:${problem}:implied-by-surface:${surface}`);
        }
      }
    }

    for (const method of methods) {
      reasons.push(`method:${method}:supported-problem-match`);
    }

    return {
      surfaces,
      problems,
      methods,
      reasons: uniqueSorted(reasons),
    };
  }
}
