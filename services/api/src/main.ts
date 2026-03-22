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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const allowedOrigins = parseAllowedOrigins();

  app.enableCors({
    origin(origin, callback) {
      // Allow non-browser / same-origin requests with no Origin header
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["x-request-id"],
    credentials: false,
    optionsSuccessStatus: 204,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);
  expressApp.use(requestIdMiddleware);
  expressApp.use(requestLoggingMiddleware);
  expressApp.use(rateLimitMiddleware);

  // Stripe requires raw body for webhook signature verification.
  // Limit raw parsing to these exact routes to avoid impacting the rest of the API.
  expressApp.use(
    "/api/v1/webhooks/stripe",
    express.raw({ type: "application/json", limit: "1mb" }),
  );
  expressApp.use(
    "/api/v1/stripe/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
  );

  // For everything else, keep normal JSON parsing.
  expressApp.use(express.json({ limit: "1mb" }));
  expressApp.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Swagger (OpenAPI YAML)
  const openapiPath = join(__dirname, "../../../docs/api/openapi.yaml");
  console.log("OpenAPI path:", openapiPath);

  const openapiRaw = readFileSync(openapiPath, "utf8");
  const openapiDoc = yaml.load(openapiRaw) as any;

  expressApp.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  await app.listen(port);

  console.log(`Servelink API running on http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
  console.log("Allowed CORS origins:", allowedOrigins.join(", "));
}

bootstrap();
