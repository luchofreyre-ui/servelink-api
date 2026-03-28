import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";

export type CreateAutomationJobInput = {
  type: "digest" | "regression_alert" | "triage_generation";
  status: "pending" | "generated" | "sent" | "suppressed" | "failed";
  triggerSource: "schedule" | "manual" | "test";
  targetRunId?: string | null;
  baseRunId?: string | null;
  reportKind: string;
  headline?: string | null;
  shortSummary?: string | null;
  dedupeKey?: string | null;
  suppressionReason?: string | null;
  payloadJson: Prisma.InputJsonValue;
  generatedAt?: Date | null;
  sentAt?: Date | null;
  failureReason?: string | null;
};

@Injectable()
export class SystemTestsReportJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(input: CreateAutomationJobInput) {
    return this.prisma.systemTestAutomationJob.create({
      data: {
        type: input.type,
        status: input.status,
        triggerSource: input.triggerSource,
        targetRunId: input.targetRunId ?? null,
        baseRunId: input.baseRunId ?? null,
        reportKind: input.reportKind,
        headline: input.headline ?? null,
        shortSummary: input.shortSummary ?? null,
        dedupeKey: input.dedupeKey ?? null,
        suppressionReason: input.suppressionReason ?? null,
        payloadJson: input.payloadJson,
        generatedAt: input.generatedAt ?? null,
        sentAt: input.sentAt ?? null,
        failureReason: input.failureReason ?? null,
      },
    });
  }

  async updateJob(
    id: string,
    patch: Partial<
      Pick<
        CreateAutomationJobInput,
        "status" | "sentAt" | "failureReason" | "payloadJson" | "shortSummary"
      >
    >,
  ) {
    return this.prisma.systemTestAutomationJob.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.sentAt !== undefined ? { sentAt: patch.sentAt } : {}),
        ...(patch.failureReason !== undefined ? { failureReason: patch.failureReason } : {}),
        ...(patch.payloadJson !== undefined ? { payloadJson: patch.payloadJson } : {}),
        ...(patch.shortSummary !== undefined ? { shortSummary: patch.shortSummary } : {}),
      },
    });
  }

  /**
   * Prior successful suppression window: same dedupeKey already consumed for alert/digest.
   */
  async findBlockingJob(params: {
    dedupeKey: string;
    type: "digest" | "regression_alert";
    since: Date;
  }) {
    return this.prisma.systemTestAutomationJob.findFirst({
      where: {
        dedupeKey: params.dedupeKey,
        type: params.type,
        createdAt: { gte: params.since },
        status: { in: ["sent", "suppressed", "generated"] },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listRecent(limit: number) {
    const take = Math.min(Math.max(limit, 1), 200);
    return this.prisma.systemTestAutomationJob.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async getById(id: string) {
    return this.prisma.systemTestAutomationJob.findUnique({ where: { id } });
  }

  async countSince(since: Date) {
    const [sent, suppressed, failed, generated] = await Promise.all([
      this.prisma.systemTestAutomationJob.count({
        where: { createdAt: { gte: since }, status: "sent" },
      }),
      this.prisma.systemTestAutomationJob.count({
        where: { createdAt: { gte: since }, status: "suppressed" },
      }),
      this.prisma.systemTestAutomationJob.count({
        where: { createdAt: { gte: since }, status: "failed" },
      }),
      this.prisma.systemTestAutomationJob.count({
        where: { createdAt: { gte: since }, status: "generated" },
      }),
    ]);
    return { sent, suppressed, failed, generated, total: sent + suppressed + failed + generated };
  }

  async latestJobOfType(type: "digest" | "regression_alert" | "triage_generation") {
    return this.prisma.systemTestAutomationJob.findFirst({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }
}
