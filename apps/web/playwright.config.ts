import { defineConfig, devices } from "@playwright/test";
import { PLAYWRIGHT_NEST_API_ORIGIN } from "./tests/playwright/helpers/env";

/** Full-corpus / pipeline / long-running checks (scheduled deep-integrity lane). */
const DEEP_TEST_GLOBS = ["**/content.quality.spec.ts", "**/pipeline.integrity.spec.ts"] as const;

function resolvePlaywrightWebPort(): string {
  if (process.env.PLAYWRIGHT_WEB_PORT) {
    return process.env.PLAYWRIGHT_WEB_PORT;
  }
  const base = process.env.PLAYWRIGHT_BASE_URL;
  if (base) {
    try {
      const u = new URL(base);
      if (u.port) {
        return u.port;
      }
      return u.protocol === "https:" ? "443" : "80";
    } catch {
      // fall through
    }
  }
  return "3002";
}

/**
 * Dedicated port for `next start` so Playwright does not hit a stale dev server whose HTML
 * references chunk hashes that no longer exist under `.next` (static assets then return 400 and
 * React never hydrates — AuthRoleGate stays on the SSR guest shell).
 * When CI sets PLAYWRIGHT_BASE_URL to :3000, the command must use the same port (see workflow).
 */
const PLAYWRIGHT_WEB_PORT = resolvePlaywrightWebPort();
if (!process.env.PLAYWRIGHT_BASE_URL) {
  process.env.PLAYWRIGHT_BASE_URL = `http://127.0.0.1:${PLAYWRIGHT_WEB_PORT}`;
}
const baseURL = process.env.PLAYWRIGHT_BASE_URL.replace(/\/$/, "");

const skipWebServer =
  process.env.CI === "true" || process.env.PLAYWRIGHT_SKIP_WEBSERVER === "true";

export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  /** Stop after first failure in CI to reduce noisy logs when something breaks. */
  maxFailures: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["json", { outputFile: process.env.PLAYWRIGHT_JSON_REPORT || "/tmp/playwright-report.json" }],
  ],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: `npx next start -p ${PLAYWRIGHT_WEB_PORT}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...process.env,
            NEXT_PUBLIC_API_BASE_URL: PLAYWRIGHT_NEST_API_ORIGIN,
            SERVELINK_INTERNAL_API_BASE_URL: PLAYWRIGHT_NEST_API_ORIGIN,
            PLAYWRIGHT: "true",
          },
        },
      }),
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "fast",
      testIgnore: [...DEEP_TEST_GLOBS],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "deep",
      testMatch: [...DEEP_TEST_GLOBS],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
