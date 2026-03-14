import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "./prisma";

@Controller("/api/v1")
export class ReadinessController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ready", db: "ok" };
    } catch {
      throw new ServiceUnavailableException({
        status: "not_ready",
        db: "down",
      });
    }
  }
}
