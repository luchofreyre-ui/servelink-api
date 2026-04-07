import "dotenv/config";
import "reflect-metadata";

import { validateEnv } from "./config/env.validation";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./filters/api-exception.filter";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { requestLoggingMiddleware } from "./middleware/request-logging.middleware";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";

import { readFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import * as swaggerUi from "swagger-ui-express";
import express from "express";
import { STRIPE_WEBHOOK_HTTP_PATH } from "./modules/billing/stripe-webhook.constants";

function parseAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS?.trim();

  if (configured) {
    return configured
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ];
}

async function bootstrap() {
  validateEnv(process.env as Record<string, string | undefined>);

  // IMPORTANT:
  // We disable Nest's default bodyParser so we can apply:
  // - express.raw() for Stripe webhooks (must read raw body)
  // - express.json() for everything else
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.useGlobalFilters(new ApiExceptionFilter());

  const allowedOrigins = parseAllowedOrigins();

  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
    exposedHeaders: ["x-request-id"],
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);
  expressApp.use(requestIdMiddleware);
  expressApp.use(requestLoggingMiddleware);
  expressApp.use(rateLimitMiddleware);

  // Stripe requires raw body for webhook signature verification (single ingress: STRIPE_WEBHOOK_HTTP_PATH).
  expressApp.use(
    STRIPE_WEBHOOK_HTTP_PATH,
    express.raw({ type: "application/json", limit: "1mb" }),
  );

  // For everything else, keep normal JSON parsing.
  expressApp.use(express.json({ limit: "1mb" }));
  expressApp.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Swagger (OpenAPI YAML) - optional
  try {
    const openapiPath = join(__dirname, "../../docs/api/openapi.yaml");
    console.log("OpenAPI path:", openapiPath);

    const openapiRaw = readFileSync(openapiPath, "utf8");
    const openapiDoc = yaml.load(openapiRaw) as any;

    expressApp.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
    console.log("Swagger UI enabled at /docs");
  } catch (err) {
    console.warn("OpenAPI spec not found, Swagger UI disabled:", (err as Error).message);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`Servelink API running on http://localhost:${port}`);
  console.log("Allowed CORS origins:", allowedOrigins.join(", "));
}

bootstrap();
