import type { Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import { openAuthedRolePage } from "../helpers/role-auth";
import {
  fetchPlaywrightScenario,
  resolveFoCredentialsFromScenario,
  type PlaywrightScenario,
} from "../helpers/scenario";

type FoFixture = {
  scenario: PlaywrightScenario["scenario"];
  /** API JWT; same value persisted to `localStorage.token` by {@link openFoAuthedPath}. */
  foToken: string;
  /** Seeded booking ids from the Playwright scenario endpoint. */
  foBookingIds: PlaywrightScenario["scenario"]["bookingIds"];
};

export const test = base.extend<FoFixture>({
  scenario: async ({}, use) => {
    const payload = await fetchPlaywrightScenario();
    await use(payload.scenario);
  },

  foToken: async ({ scenario }, use) => {
    const credentials = resolveFoCredentialsFromScenario(scenario);
    const token = await loginViaApi(credentials.email, credentials.password);
    await use(token);
  },

  foBookingIds: async ({ scenario }, use) => {
    await use(scenario.bookingIds);
  },
});

export { expect };

/** Returns the FO JWT from the fixture (alias for clarity in specs). */
export function storedFoAuthToken(foToken: string): string {
  return foToken;
}

export async function openFoAuthedPath(page: Page, foToken: string, path: string): Promise<void> {
  await openAuthedRolePage(page, foToken, path);
}

export function foKnowledgeHubPath(): string {
  return "/fo/knowledge";
}

export function foBookingDetailPath(bookingId: string): string {
  return `/fo/bookings/${bookingId}`;
}
