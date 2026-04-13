import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { applyBodyParserMiddleware } from "./http/configure-body-parsers";

/** Default browser origins for local Next.js dev when `CORS_ORIGINS` is unset or empty. */
const DEFAULT_LOCAL_DEV_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
];

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  const fromEnv = raw
    ? raw
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  if (fromEnv.length === 0) {
    return [...DEFAULT_LOCAL_DEV_ORIGINS];
  }

  return [...new Set([...DEFAULT_LOCAL_DEV_ORIGINS, ...fromEnv])];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  applyBodyParserMiddleware(app.getHttpAdapter().getInstance());

  const allowedOrigins = parseAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // allow server-to-server / curl / no-origin requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);

  console.log("Servelink API running");
  console.log("Allowed CORS origins:", allowedOrigins);
}

bootstrap();
