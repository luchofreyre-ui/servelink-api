import type { Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import { openAuthedRolePage } from "../helpers/role-auth";
import {
  fetchPlaywrightScenario,
  resolveCustomerCredentialsFromScenario,
  type PlaywrightScenario,
} from "../helpers/scenario";

type CustomerFixture = {
  scenario: PlaywrightScenario["scenario"];
  /** API JWT; same value persisted to `localStorage.token` by {@link openCustomerAuthedPath}. */
  customerToken: string;
  /** Seeded booking ids from the Playwright scenario endpoint. */
  customerBookingIds: PlaywrightScenario["scenario"]["bookingIds"];
};

export const test = base.extend<CustomerFixture>({
  scenario: async ({}, use) => {
    const payload = await fetchPlaywrightScenario();
    await use(payload.scenario);
  },

  customerToken: async ({ scenario }, use) => {
    const credentials = resolveCustomerCredentialsFromScenario(scenario);
    const token = await loginViaApi(credentials.email, credentials.password);
    await use(token);
  },

  customerBookingIds: async ({ scenario }, use) => {
    await use(scenario.bookingIds);
  },
});

export { expect };

export function storedCustomerAuthToken(customerToken: string): string {
  return customerToken;
}

export async function openCustomerAuthedPath(
  page: Page,
  customerToken: string,
  path: string,
): Promise<void> {
  await openAuthedRolePage(page, customerToken, path);
}

export function customerDashboardPath(): string {
  return "/customer";
}

export function customerBookingDetailPath(bookingId: string): string {
  return `/customer/bookings/${bookingId}`;
}
