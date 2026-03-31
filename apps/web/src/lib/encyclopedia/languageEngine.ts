// languageEngine.ts

type NounNumber = "singular" | "plural";

const IRREGULAR_PLURALS = new Set([
  "stains",
  "marks",
  "spots",
  "streaks",
  "residues",
]);

const SINGULAR_MASS_NOUNS = new Set([
  "dullness",
  "haze",
  "buildup",
  "residue",
  "limescale",
  "soap scum",
  "grease buildup",
  "discoloration",
]);

export function detectNounNumber(problem: string): NounNumber {
  const normalized = problem.toLowerCase().trim();

  if (SINGULAR_MASS_NOUNS.has(normalized)) return "singular";

  if (IRREGULAR_PLURALS.has(normalized)) return "plural";

  if (normalized.endsWith("s")) return "plural";

  return "singular";
}

export function getVerbAgreement(number: NounNumber) {
  return number === "plural"
    ? { do: "do", does: "do", happen: "happen", is: "are" }
    : { do: "does", does: "does", happen: "happens", is: "is" };
}

// Sentence case normalization
export function normalizeCasing(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) return input;

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Fix common grammar patterns
export function smoothGrammar(title: string): string {
  return title
    // Fix "why do dullness happen"
    .replace(/why do ([a-z\s]+) happen/gi, (_, noun) => {
      const number = detectNounNumber(noun);
      const verbs = getVerbAgreement(number);
      return `why ${verbs.do} ${noun} ${verbs.happen}`;
    })
    // Fix "why does stains happen"
    .replace(/why does ([a-z\s]+) happen/gi, (_, noun) => {
      const number = detectNounNumber(noun);
      const verbs = getVerbAgreement(number);
      return `why ${verbs.do} ${noun} ${verbs.happen}`;
    })
    // Normalize "after using the Wrong Cleaner"
    .replace(/after using the ([a-z\s]+)/gi, (_, phrase) => {
      return `after using the ${phrase.toLowerCase()}`;
    });
}

// FINAL PIPELINE
export function finalizeTitle(title: string): string {
  let output = title;

  output = smoothGrammar(output);
  output = normalizeCasing(output);

  return output;
}
