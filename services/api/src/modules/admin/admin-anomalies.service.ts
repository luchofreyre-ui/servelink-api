import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminAnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  async listOpen() {
    return this.prisma.opsAnomaly.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            scheduledStart: true,
          },
        },
        fo: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async acknowledge(id: string) {
    return this.prisma.opsAnomaly.update({
      where: { id },
      data: { status: "acknowledged" },
    });
  }

  async resolve(id: string) {
    return this.prisma.opsAnomaly.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
      },
    });
  }
}
