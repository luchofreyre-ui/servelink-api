// pageBuilder.ts

import type { GeneratedPage } from "./pageTypes";
import { BASE_PAGE_TEMPLATE } from "./pageTemplate";
import { slugify } from "./slugify";
import { buildMeta } from "./metaBuilder";

export function buildPage(
  title: string,
  problem: string,
  surface: string,
  intent: string
): GeneratedPage {
  const slug = slugify(title);

  const meta = buildMeta(problem, surface);
  meta.intent = intent;

  return {
    title,
    slug,
    meta,
    sections: BASE_PAGE_TEMPLATE,
  };
}
