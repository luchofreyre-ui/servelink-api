import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/runtimeVersion", () => ({
  buildWebRuntimeVersion: () => ({
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
  }),
}));

import { GET } from "./route";

describe("GET /api/version", () => {
  it("returns the non-secret web runtime version payload", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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
  });
});
