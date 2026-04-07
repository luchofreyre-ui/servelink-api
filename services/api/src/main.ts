import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return [];

  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
