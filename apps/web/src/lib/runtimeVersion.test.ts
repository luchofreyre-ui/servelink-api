import { describe, expect, it } from "vitest";

import { buildWebRuntimeVersion } from "./runtimeVersion";

describe("buildWebRuntimeVersion", () => {
  it("returns stable non-secret runtime version metadata", () => {
    const response = buildWebRuntimeVersion({
      VERCEL_GIT_COMMIT_SHA: "54fd46a7162986e71879c084b4f8ff2b6294c226",
      NEXT_PUBLIC_BUILD_TIME: "2026-05-17T05:00:00.000Z",
      DATABASE_URL: "postgresql://secret",
      STRIPE_SECRET_KEY: "sk_test_secret",
    });

    expect(response).toEqual({
      service: "servelink-web",
      version: {
        gitSha: "54fd46a7162986e71879c084b4f8ff2b6294c226",
        shortGitSha: "54fd46a",
        buildTime: "2026-05-17T05:00:00.000Z",
        source: {
          gitSha: "env",
          buildTime: "env",
        },
      },
    });

    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("STRIPE_SECRET_KEY");
    expect(serialized).not.toContain("postgresql://secret");
    expect(serialized).not.toContain("sk_test_secret");
  });

  it("falls back to unknown for invalid or missing metadata", () => {
    expect(
      buildWebRuntimeVersion({
        VERCEL_GIT_COMMIT_SHA: "not-a-sha",
        NEXT_PUBLIC_BUILD_TIME: "not a date",
      }),
    ).toEqual({
      service: "servelink-web",
      version: {
        gitSha: "unknown",
        shortGitSha: "unknown",
        buildTime: "unknown",
        source: {
          gitSha: "unknown",
          buildTime: "unknown",
        },
      },
    });
  });
});
