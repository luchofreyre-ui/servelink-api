import { getEncyclopediaPageBySlug } from "../../src/lib/encyclopedia/encyclopediaContentResolver";

const slug = process.argv[2]?.trim();
if (!slug) {
  console.error("Usage: tsx scripts/encyclopedia/test-resolve.ts <slug>");
  process.exit(1);
}

const page = getEncyclopediaPageBySlug(slug);
console.log(JSON.stringify(page, null, 2));
