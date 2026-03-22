import { Controller, Get } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Controller("/api/v1/system")
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  health() {
    return {
      ok: true,
      service: "servelink-api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("readiness")
  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      database: "reachable",
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      webBaseUrl: process.env.WEB_BASE_URL ?? null,
      timestamp: new Date().toISOString(),
    };
  }
}
