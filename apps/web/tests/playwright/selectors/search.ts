import type { Page } from "@playwright/test";

/** Stable `data-testid` values for global search + search results (apps/web). */
export const searchTestIds = {
  globalSearchForm: "global-search-form",
  globalSearchInput: "global-search-input",
  globalSearchSubmit: "global-search-submit",
  globalSearchSuggestions: "global-search-suggestions",
  globalSearchSuggestionItem: "global-search-suggestion-item",
  searchResultsPage: "search-results-page",
  searchBestMatch: "search-best-match",
  searchGroup: "search-group",
} as const;

export function globalSearchFormLocator(page: Page) {
  return page.getByTestId(searchTestIds.globalSearchForm);
}

export function globalSearchInputLocator(page: Page) {
  return page.getByTestId(searchTestIds.globalSearchInput);
}

export function globalSearchSubmitLocator(page: Page) {
  return page.getByTestId(searchTestIds.globalSearchSubmit);
}

export function globalSearchSuggestionsLocator(page: Page) {
  return page.getByTestId(searchTestIds.globalSearchSuggestions);
}

export function globalSearchSuggestionItemsLocator(page: Page) {
  return page.getByTestId(searchTestIds.globalSearchSuggestionItem);
}

export function searchResultsPageLocator(page: Page) {
  return page.getByTestId(searchTestIds.searchResultsPage);
}

export function searchBestMatchLocator(page: Page) {
  return page.getByTestId(searchTestIds.searchBestMatch);
}

export function searchGroupLocators(page: Page) {
  return page.getByTestId(searchTestIds.searchGroup);
}
