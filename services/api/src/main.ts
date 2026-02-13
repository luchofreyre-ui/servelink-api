import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./filters/api-exception.filter";

import { readFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import * as swaggerUi from "swagger-ui-express";
import express from "express";

async function bootstrap() {
  // IMPORTANT:
  // We disable Nest's default bodyParser so we can apply:
  // - express.raw() for Stripe webhooks (must read raw body)
  // - express.json() for everything else
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.useGlobalFilters(new ApiExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  const expressApp = app.getHttpAdapter().getInstance();

  // Stripe requires raw body for webhook signature verification.
  // Limit raw parsing to these exact routes to avoid impacting the rest of the API.
  expressApp.use("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }));
  expressApp.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }));

  // For everything else, keep normal JSON parsing.
  expressApp.use(express.json({ limit: "2mb" }));
  expressApp.use(express.urlencoded({ extended: true }));

  // Swagger (OpenAPI YAML)
  const openapiPath = join(__dirname, "../../../docs/api/openapi.yaml");
  console.log("OpenAPI path:", openapiPath);

  const openapiRaw = readFileSync(openapiPath, "utf8");
  const openapiDoc = yaml.load(openapiRaw) as any;

  expressApp.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  await app.listen(port);

  console.log(`Servelink API running on http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
}

bootstrap();
