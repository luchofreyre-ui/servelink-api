import { promoteApprovedEncyclopediaPageAndRevalidate } from "./lib/migration/legacyEncyclopediaPromotion.server";

const slug = process.argv[2]?.trim();
if (!slug) {
  console.error("Usage: tsx scripts/encyclopedia/promote-slug-pipeline.ts <slug>");
  process.exit(1);
}

const result = promoteApprovedEncyclopediaPageAndRevalidate(slug);
console.log(result);
