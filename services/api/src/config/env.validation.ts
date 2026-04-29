import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().optional(),

  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default("usd"),
  PUBLIC_SLOT_ID_SECRET: z.string().optional(),
  PUBLIC_BOOKING_DEPOSIT_MODE: z
    .enum(["required", "bypass"])
    .default("required"),
  APP_BASE_URL: z.string().url().default("http://localhost:3001"),
  WEB_BASE_URL: z.string().url().default("http://localhost:3000"),
  REQUIRE_STRIPE: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value === "true"),

  /** Deterministic geocode for known FO matrix addresses only (see GeocodingService). */
  SERVELINK_GEOCODE_MATRIX_FIXTURE_LOOKUP: z.string().optional(),
  /** When `true`, skips Nest rate limit for POST preview-estimate only (local E2E). */
  SERVELINK_E2E_RATE_LIMIT_BYPASS: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }

  const env = parsed.data;

  if (env.REQUIRE_STRIPE) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error(
        "Invalid environment: STRIPE_SECRET_KEY is required when REQUIRE_STRIPE=true",
      );
    }
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error(
        "Invalid environment: STRIPE_WEBHOOK_SECRET is required when REQUIRE_STRIPE=true",
      );
    }
  }

  if (env.NODE_ENV === "production") {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error(
        "Invalid environment: STRIPE_SECRET_KEY is required in production",
      );
    }
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error(
        "Invalid environment: STRIPE_WEBHOOK_SECRET is required in production",
      );
    }
    if (!env.PUBLIC_SLOT_ID_SECRET) {
      throw new Error(
        "Invalid environment: PUBLIC_SLOT_ID_SECRET is required in production",
      );
    }
  }

  return env;
}
