import { test as base, expect } from "@playwright/test";
import { loginViaApi } from "./auth";
import { fetchPlaywrightAdminScenario, resolveAdminCredentialsFromScenario, PlaywrightAdminScenario } from "./scenario";

type AdminFixture = {
  scenario: PlaywrightAdminScenario["scenario"];
  adminToken: string;
};

export const test = base.extend<AdminFixture>({
  scenario: async ({}, use) => {
    const payload = await fetchPlaywrightAdminScenario();
    await use(payload.scenario);
  },

  adminToken: async ({ scenario }, use) => {
    const { email, password } = resolveAdminCredentialsFromScenario(scenario);
    const token = await loginViaApi(email, password);
    await use(token);
  },
});

export { expect };
