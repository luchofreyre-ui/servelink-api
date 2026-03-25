import { test as base, expect } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import {
  fetchPlaywrightScenario,
  resolveAdminCredentialsFromScenario,
  type PlaywrightScenario,
} from "../helpers/scenario";

type AdminFixture = {
  scenario: PlaywrightScenario["scenario"];
  adminToken: string;
};

export const test = base.extend<AdminFixture>({
  scenario: async ({}, use) => {
    const payload = await fetchPlaywrightScenario();
    await use(payload.scenario);
  },

  adminToken: async ({ scenario }, use) => {
    const { email, password } = resolveAdminCredentialsFromScenario(scenario);
    const token = await loginViaApi(email, password);
    await use(token);
  },
});

export { expect };
