import { PLAYWRIGHT_ADMIN_EMAIL, PLAYWRIGHT_ADMIN_PASSWORD, PLAYWRIGHT_SCENARIO_URL } from "./env";

export type PlaywrightAdminScenario = {
  ok: true;
  scenario: {
    adminEmail: string;
    adminPassword: string;
    customerEmail: string;
    foIds: string[];
    bookingIds: {
      pendingDispatch: string;
      hold: string;
      review: string;
      active: string;
    };
    exceptionId: string | null;
    anomalyId: string | null;
    /** Present when API dev scenario includes isolated mutation bookings (newer API). */
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

export async function fetchPlaywrightAdminScenario(): Promise<PlaywrightAdminScenario> {
  const response = await fetch(PLAYWRIGHT_SCENARIO_URL, {
    method: "GET",
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Playwright admin scenario: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as PlaywrightAdminScenario;

  if (!json?.ok || !json?.scenario) {
    throw new Error("Invalid Playwright admin scenario payload");
  }

  return json;
}

export function resolveAdminCredentialsFromScenario(
  scenario: PlaywrightAdminScenario["scenario"],
): { email: string; password: string } {
  const email = PLAYWRIGHT_ADMIN_EMAIL || scenario.adminEmail;
  const password = PLAYWRIGHT_ADMIN_PASSWORD || scenario.adminPassword;

  if (!email || !password) {
    throw new Error("Missing admin credentials for Playwright run");
  }

  return { email, password };
}
