import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "./prisma";
import { ProviderResolverService } from "./modules/fo/provider-resolver.service";

@Controller("/api/v1")
export class ReadinessController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerResolver: ProviderResolverService,
  ) {}

  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      const providerIntegrity =
        await this.providerResolver.getFoProviderIntegritySummary();

      if (!providerIntegrity.healthy) {
        throw new ServiceUnavailableException({
          status: "not_ready",
          db: "ok",
          providerIntegrity,
        });
      }

      return {
        status: "ready",
        db: "ok",
        providerIntegrity,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        status: "not_ready",
        db: "down",
      });
    }
  }
}
