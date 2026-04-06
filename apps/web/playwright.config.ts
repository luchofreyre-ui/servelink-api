import { defineConfig, devices } from "@playwright/test";
import { PLAYWRIGHT_NEST_API_ORIGIN } from "./tests/playwright/helpers/env";

/** Full-corpus / pipeline / long-running checks (scheduled deep-integrity lane). */
const DEEP_TEST_GLOBS = ["**/content.quality.spec.ts", "**/pipeline.integrity.spec.ts"] as const;

/**
 * Dedicated port for `next start` so Playwright does not hit a stale dev server whose HTML
 * references chunk hashes that no longer exist under `.next` (static assets then return 400 and
 * React never hydrates — AuthRoleGate stays on the SSR guest shell).
 */
const PLAYWRIGHT_WEB_PORT = process.env.PLAYWRIGHT_WEB_PORT || "3002";
if (!process.env.PLAYWRIGHT_BASE_URL) {
  process.env.PLAYWRIGHT_BASE_URL = `http://127.0.0.1:${PLAYWRIGHT_WEB_PORT}`;
}
const baseURL = process.env.PLAYWRIGHT_BASE_URL.replace(/\/$/, "");

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1";

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
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
          timeout: 120_000,
          // Align with CI (`NEXT_PUBLIC_API_BASE_URL` → Nest). Client bundle still comes from
          // `npm run build`; this helps any server/runtime paths and keeps env explicit.
          env: {
            ...process.env,
            NEXT_PUBLIC_API_BASE_URL: PLAYWRIGHT_NEST_API_ORIGIN,
            // Not inlined at build time — RSC `apiFetch` reads this at `next start` runtime.
            SERVELINK_INTERNAL_API_BASE_URL: PLAYWRIGHT_NEST_API_ORIGIN,
            // Strict `loadAdminOpsPageData` SSR (rethrow vs empty fallback) when NODE_ENV=production.
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
