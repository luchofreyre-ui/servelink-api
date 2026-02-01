import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { readFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import * as swaggerUi from "swagger-ui-express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  // IMPORTANT: when running via ts-node, __dirname points to services/api/src
  const openapiPath = join(__dirname, "../../../docs/api/openapi.yaml");
  console.log("OpenAPI path:", openapiPath);

  const openapiRaw = readFileSync(openapiPath, "utf8");
  const openapiDoc = yaml.load(openapiRaw) as any;

  // Mount Swagger using the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // Serve Swagger UI at /docs/ (Express will auto-redirect /docs -> /docs/)
  expressApp.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  await app.listen(port);

  console.log(`Servelink API running on http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
}

bootstrap();
