import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type TrustPayload = Record<string, unknown> | null;

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(input: {
    bookingId: string;
    foId?: string | null;
    type:
      | "start"
      | "complete"
      | "incident"
      | "qc_pass"
      | "qc_fail"
      | "evidence_uploaded"
      | "customer_review";
    payload?: TrustPayload;
  }) {
    return this.prisma.trustEvent.create({
      data: {
        bookingId: input.bookingId,
        foId: input.foId ?? null,
        type: input.type,
        payload:
          input.payload === undefined
            ? undefined
            : input.payload === null
              ? Prisma.JsonNull
              : (input.payload as Prisma.InputJsonValue),
      },
    });
  }

  async getFoTrustScore(foId: string) {
    const events = await this.prisma.trustEvent.findMany({
      where: { foId },
      select: { type: true },
    });

    let score = 100;

    for (const event of events) {
      if (event.type === "incident") score -= 10;
      if (event.type === "qc_fail") score -= 7;
      if (event.type === "qc_pass") score += 2;
      if (event.type === "complete") score += 1;
      if (event.type === "customer_review") score += 1;
    }

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return {
      foId,
      score,
      eventCount: events.length,
    };
  }
}
