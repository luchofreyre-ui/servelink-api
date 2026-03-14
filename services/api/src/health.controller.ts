import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "./prisma";

@Controller("/api/v1")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "ok" };
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        db: "down",
      });
    }
  }
}
