import { defineConfig, devices } from "@playwright/test";

/** Full-corpus / pipeline / long-running checks (scheduled deep-integrity lane). */
const DEEP_TEST_GLOBS = ["**/content.quality.spec.ts", "**/pipeline.integrity.spec.ts"] as const;

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
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
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
