import type { Page } from "@playwright/test";

/** Stable `data-testid` values for FO knowledge, booking shortcuts, customer cards, encyclopedia. */
export const knowledgeTestIds = {
  foKnowledgePage: "fo-knowledge-page",
  foKnowledgeSearchPanel: "fo-knowledge-search-panel",
  foQuickSolveForm: "fo-quick-solve-form",
  foQuickSolveSurfaceSelect: "fo-quick-solve-surface-select",
  foQuickSolveProblemSelect: "fo-quick-solve-problem-select",
  foQuickSolveSeverityLight: "fo-quick-solve-severity-light",
  foQuickSolveSeverityMedium: "fo-quick-solve-severity-medium",
  foQuickSolveSeverityHeavy: "fo-quick-solve-severity-heavy",
  foQuickSolveSubmit: "fo-quick-solve-submit",
  foQuickSolveResult: "fo-quick-solve-result",
  foQuickSolvePrefillBanner: "fo-quick-solve-prefill-banner",
  foBookingKnowledgeActions: "fo-booking-knowledge-actions",
  foBookingScenarioShortcuts: "fo-booking-scenario-shortcuts",
  foBookingOpenQuickSolve: "fo-booking-open-quick-solve",
  foBookingSearchKnowledge: "fo-booking-search-knowledge",
  customerDashboardKnowledgeCard: "customer-dashboard-knowledge-card",
  customerDashboardRecommendations: "customer-dashboard-recommendations",
  customerBookingKnowledgeCard: "customer-booking-knowledge-card",
  encyclopediaPage: "encyclopedia-page",
  encyclopediaHeroSearch: "encyclopedia-hero-search",
  publicNavEncyclopedia: "public-nav-encyclopedia",
} as const;

export function foKnowledgePageLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.foKnowledgePage);
}

export function foQuickSolveFormLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.foQuickSolveForm);
}

export function foQuickSolveResultLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.foQuickSolveResult);
}

export function foBookingScenarioShortcutsLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.foBookingScenarioShortcuts);
}

export function customerDashboardKnowledgeCardLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.customerDashboardKnowledgeCard);
}

export function customerDashboardRecommendationsLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.customerDashboardRecommendations);
}

export function customerBookingKnowledgeCardLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.customerBookingKnowledgeCard);
}

export function encyclopediaPageLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.encyclopediaPage);
}

export function encyclopediaHeroSearchLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.encyclopediaHeroSearch);
}

/**
 * Header renders the encyclopedia link twice (desktop + mobile breakpoints). Use `.first()` or scope by viewport.
 */
export function publicNavEncyclopediaLocator(page: Page) {
  return page.getByTestId(knowledgeTestIds.publicNavEncyclopedia).first();
}
