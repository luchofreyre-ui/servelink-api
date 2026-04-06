import {
  PLAYWRIGHT_ADMIN_EMAIL,
  PLAYWRIGHT_ADMIN_PASSWORD,
  PLAYWRIGHT_CUSTOMER_EMAIL,
  PLAYWRIGHT_CUSTOMER_PASSWORD,
  PLAYWRIGHT_FO_EMAIL,
  PLAYWRIGHT_FO_PASSWORD,
  PLAYWRIGHT_SCENARIO_URL,
} from "./env";

let cachedScenario: PlaywrightScenario | null = null;

/** Clears cached GET /dev/playwright/admin-scenario so the next fetch re-runs the Nest seed. */
export function clearPlaywrightScenarioCache(): void {
  cachedScenario = null;
}

/** Forces a fresh scenario payload (re-seeds deterministic bookings/dispatch control). */
export async function fetchFreshPlaywrightScenario(): Promise<PlaywrightScenario> {
  clearPlaywrightScenarioCache();
  return fetchPlaywrightScenario();
}

export type PlaywrightScenario = {
  ok: true;
  scenario: {
    adminEmail: string;
    adminPassword: string;

    customerEmail: string;
    customerPassword?: string | null;

    foEmail?: string | null;
    foPassword?: string | null;
    foIds: string[];

    bookingIds: {
      pendingDispatch: string;
      hold: string;
      review: string;
      active: string;
    };

    exceptionId: string | null;
    anomalyId: string | null;

    commandCenterMutationBookingIds?: {
      operatorNote: string;
      hold: string;
      markReview: string;
      approve: string;
      reassign: string;
    };

    dispatchConfig: {
      activeId: string | null;
      draftId: string | null;
    };
  };
};

export async function fetchPlaywrightScenario(): Promise<PlaywrightScenario> {
  if (cachedScenario) {
    return cachedScenario;
  }

  const response = await fetch(PLAYWRIGHT_SCENARIO_URL, {
    method: "GET",
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Playwright scenario: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as PlaywrightScenario;

  if (!json?.ok || !json?.scenario) {
    throw new Error("Invalid Playwright scenario payload");
  }

  cachedScenario = json;

  return json;
}

export function resolveAdminCredentialsFromScenario(
  scenario: PlaywrightScenario["scenario"],
): { email: string; password: string } {
  const email = PLAYWRIGHT_ADMIN_EMAIL || scenario.adminEmail;
  const password = PLAYWRIGHT_ADMIN_PASSWORD || scenario.adminPassword;

  if (!email || !password) {
    throw new Error("Missing admin credentials for Playwright run");
  }

  return { email, password };
}

export function resolveCustomerCredentialsFromScenario(
  scenario: PlaywrightScenario["scenario"],
): { email: string; password: string } {
  const email = PLAYWRIGHT_CUSTOMER_EMAIL || scenario.customerEmail;
  const password = PLAYWRIGHT_CUSTOMER_PASSWORD || scenario.customerPassword || "";

  if (!email || !password) {
    throw new Error("Missing customer credentials for Playwright run");
  }

  return { email, password };
}

export function resolveFoCredentialsFromScenario(
  scenario: PlaywrightScenario["scenario"],
): { email: string; password: string } {
  const email = PLAYWRIGHT_FO_EMAIL || scenario.foEmail || "";
  const password = PLAYWRIGHT_FO_PASSWORD || scenario.foPassword || "";

  if (!email || !password) {
    throw new Error("Missing FO credentials for Playwright run");
  }

  return { email, password };
}
