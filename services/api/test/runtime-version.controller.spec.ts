import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { RuntimeVersionController } from "../src/runtime-version.controller";
import { buildApiRuntimeVersion } from "../src/runtime-version";

describe("RuntimeVersionController", () => {
  let app: INestApplication;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      RAILWAY_GIT_COMMIT_SHA: "54fd46a7162986e71879c084b4f8ff2b6294c226",
      BUILD_TIME: "2026-05-17T05:00:00.000Z",
      DATABASE_URL: "postgresql://secret",
      STRIPE_SECRET_KEY: "sk_test_secret",
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RuntimeVersionController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    process.env = originalEnv;
  });

  it("returns stable non-secret runtime version metadata", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/system/version")
      .expect(200);

    expect(res.body).toEqual({
      service: "servelink-api",
      version: {
        gitSha: "54fd46a7162986e71879c084b4f8ff2b6294c226",
        shortGitSha: "54fd46a",
        buildTime: "2026-05-17T05:00:00.000Z",
        source: {
          gitSha: "env",
          buildTime: "env",
        },
      },
      runtime: {
        nodeEnv: "test",
      },
    });

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("STRIPE_SECRET_KEY");
    expect(serialized).not.toContain("postgresql://secret");
    expect(serialized).not.toContain("sk_test_secret");
  });

  it("falls back to unknown for invalid or missing metadata", () => {
    expect(
      buildApiRuntimeVersion({
        NODE_ENV: "staging",
        RAILWAY_GIT_COMMIT_SHA: "not a sha",
        BUILD_TIME: "not a date",
      }),
    ).toEqual({
      service: "servelink-api",
      version: {
        gitSha: "unknown",
        shortGitSha: "unknown",
        buildTime: "unknown",
        source: {
          gitSha: "unknown",
          buildTime: "unknown",
        },
      },
      runtime: {
        nodeEnv: "unknown",
      },
    });
  });
});
