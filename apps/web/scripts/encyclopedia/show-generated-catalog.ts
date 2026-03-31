import { generatePages } from "../../src/lib/encyclopedia/generateCandidates";

const pages = generatePages();
console.log({
  count: pages.length,
  sampleSlugs: pages.slice(0, 5).map((p) => p.slug),
});
