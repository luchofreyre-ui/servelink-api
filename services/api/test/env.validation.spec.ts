import { validateEnv } from "../src/config/env.validation";

describe("validateEnv", () => {
  const base = {
    DATABASE_URL: "postgresql://localhost:5432/servelink",
    JWT_SECRET: "jwt-secret-at-least-one-char",
  };

  it("passes when REQUIRE_STRIPE=false and Stripe keys missing", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "development",
        REQUIRE_STRIPE: "false",
      }),
    ).not.toThrow();
  });

  it("fails when REQUIRE_STRIPE=true and STRIPE_SECRET_KEY missing", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "development",
        REQUIRE_STRIPE: "true",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      }),
    ).toThrow(/STRIPE_SECRET_KEY is required when REQUIRE_STRIPE=true/);
  });

  it("fails when REQUIRE_STRIPE=true and STRIPE_WEBHOOK_SECRET missing", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "development",
        REQUIRE_STRIPE: "true",
        STRIPE_SECRET_KEY: "sk_test_x",
      }),
    ).toThrow(/STRIPE_WEBHOOK_SECRET is required when REQUIRE_STRIPE=true/);
  });

  it("fails in production when STRIPE_SECRET_KEY missing", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "production",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PUBLIC_SLOT_ID_SECRET: "slot_secret_test",
      }),
    ).toThrow(/STRIPE_SECRET_KEY is required in production/);
  });

  it("fails in production when STRIPE_WEBHOOK_SECRET missing", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "production",
        STRIPE_SECRET_KEY: "sk_live_x",
        PUBLIC_SLOT_ID_SECRET: "slot_secret_test",
      }),
    ).toThrow(/STRIPE_WEBHOOK_SECRET is required in production/);
  });

  it("fails in production when PUBLIC_SLOT_ID_SECRET missing", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "production",
        STRIPE_SECRET_KEY: "sk_live_x",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      }),
    ).toThrow(/PUBLIC_SLOT_ID_SECRET is required in production/);
  });
});
