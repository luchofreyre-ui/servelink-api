import { Injectable } from "@nestjs/common";
import type {
  Prisma,
  SystemTestPipelineJobStage,
  SystemTestPipelineJobStatus,
  SystemTestPipelineTriggerSource,
} from "@prisma/client";

import { PrismaService } from "../../prisma";

const ACTIVE_STATUSES: SystemTestPipelineJobStatus[] = [
  "queued",
  "running",
  "retrying",
];

@Injectable()
export class SystemTestsPipelineJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByDedupeKey(
    stage: SystemTestPipelineJobStage,
    dedupeKey: string,
  ) {
    return this.prisma.systemTestPipelineJob.findFirst({
      where: {
        stage,
        dedupeKey,
        status: { in: ACTIVE_STATUSES },
      },
    });
  }

  async createJob(input: {
    runId: string | null;
    stage: SystemTestPipelineJobStage;
    triggerSource: SystemTestPipelineTriggerSource;
    dedupeKey: string | null;
    payloadJson: Prisma.InputJsonValue;
    parentJobId?: string | null;
    maxAttempts?: number;
  }) {
    return this.prisma.systemTestPipelineJob.create({
      data: {
        runId: input.runId,
        stage: input.stage,
        status: "queued",
        triggerSource: input.triggerSource,
        dedupeKey: input.dedupeKey,
        payloadJson: input.payloadJson,
        parentJobId: input.parentJobId ?? null,
        maxAttempts: input.maxAttempts ?? 3,
      },
    });
  }

  async getById(id: string) {
    return this.prisma.systemTestPipelineJob.findUnique({ where: { id } });
  }

  async markQueueJobId(id: string, queueJobId: string) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: { queueJobId },
    });
  }

  async markRunning(id: string, attemptCount: number) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: {
        status: "running",
        attemptCount,
        startedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markRetrying(id: string, errorMessage: string, attemptCount: number) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: {
        status: "retrying",
        errorMessage: errorMessage.slice(0, 8000),
        attemptCount,
      },
    });
  }

  async markCompleted(id: string) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMessage: null,
        dedupeKey: null,
      },
    });
  }

  async markFailed(id: string, errorMessage: string) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: {
        status: "failed",
        errorMessage: errorMessage.slice(0, 8000),
        completedAt: new Date(),
      },
    });
  }

  async markDead(id: string, errorMessage: string) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: {
        status: "dead",
        errorMessage: errorMessage.slice(0, 8000),
        completedAt: new Date(),
      },
    });
  }

  async resetToQueuedForRetry(id: string) {
    await this.prisma.systemTestPipelineJob.update({
      where: { id },
      data: {
        status: "queued",
        queueJobId: null,
        errorMessage: null,
        completedAt: null,
      },
    });
  }

  async listRecent(limit: number) {
    const take = Math.min(200, Math.max(1, limit));
    return this.prisma.systemTestPipelineJob.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async listByRunId(runId: string, limit: number) {
    const take = Math.min(100, Math.max(1, limit));
    return this.prisma.systemTestPipelineJob.findMany({
      where: { runId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
