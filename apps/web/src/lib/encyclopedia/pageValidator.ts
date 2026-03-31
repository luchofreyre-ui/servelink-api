// pageValidator.ts

import type { GeneratedPage } from "./pageTypes";

export function validatePage(page: GeneratedPage): boolean {
  if (!page.title) return false;
  if (!page.slug) return false;

  const requiredSections = page.sections.filter((s) => s.required);

  if (requiredSections.length < 6) return false;

  if (!page.meta.problem || !page.meta.surface) return false;

  return true;
}
