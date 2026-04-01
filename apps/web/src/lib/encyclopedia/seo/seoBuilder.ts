type SeoInput = {
  surface: string;
  problem: string;
  intent: string;
  sections: Record<string, string>;
};

function kebab(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function buildSeo(input: SeoInput) {
  const { surface, problem, intent, sections } = input;

  void `${problem} ${surface}`;

  const titleMap: Record<string, string> = {
    "how-remove": `How to Remove ${problem} from ${surface}`,
    "how-clean": `How to Clean ${problem} from ${surface}`,
    "how-prevent": `How to Prevent ${problem} on ${surface}`,
    "what-causes": `What Causes ${problem} on ${surface}`,
    "how-fix": `How to Fix ${problem} on ${surface}`,
    diagnosis: `How to Identify ${problem} on ${surface}`,
  };

  const title = titleMap[intent] || `${problem} on ${surface}`;
  const slug = kebab(title);

  const meta =
    sections?.whyItHappens?.slice(0, 120) ||
    sections?.whatToExpect?.slice(0, 120) ||
    `Learn how to deal with ${problem} on ${surface}`;

  return {
    title,
    slug,
    metaDescription: meta,
  };
}

