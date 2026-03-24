import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DeepCleanEstimatorConfigStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG,
  DeepCleanEstimatorConfigValidationError,
  parseAndValidateDeepCleanEstimatorConfig,
  type DeepCleanEstimatorConfigPayload,
} from "./deep-clean-estimator-config.types";
import type {
  DeepCleanEstimatorVersionDetailDto,
  DeepCleanEstimatorVersionHistoryRowDto,
} from "./dto/deep-clean-estimator-governance.dto";

export type DeepCleanEstimatorConfigRowDto = {
  id: string;
  version: number;
  status: DeepCleanEstimatorConfigStatus;
  label: string;
  config: DeepCleanEstimatorConfigPayload;
  publishedAt: string | null;
  createdByUserId: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActiveTuningForEstimate = {
  id: string;
  version: number;
  label: string;
  config: DeepCleanEstimatorConfigPayload;
};

@Injectable()
export class DeepCleanEstimatorConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(row: {
    id: string;
    version: number;
    status: DeepCleanEstimatorConfigStatus;
    label: string;
    configJson: string;
    publishedAt: Date | null;
    createdByUserId: string | null;
    publishedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DeepCleanEstimatorConfigRowDto {
    const config = parseAndValidateDeepCleanEstimatorConfig(JSON.parse(row.configJson));
    return {
      id: row.id,
      version: row.version,
      status: row.status,
      label: row.label,
      config,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdByUserId: row.createdByUserId,
      publishedByUserId: row.publishedByUserId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async nextVersion(): Promise<number> {
    const agg = await this.prisma.deepCleanEstimatorConfig.aggregate({
      _max: { version: true },
    });
    return (agg._max.version ?? 0) + 1;
  }

  /** Ensures at least one active baseline row exists. */
  async bootstrapConfigIfNeeded(): Promise<void> {
    const count = await this.prisma.deepCleanEstimatorConfig.count();
    if (count > 0) return;
    await this.prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 1,
        status: DeepCleanEstimatorConfigStatus.active,
        label: "Baseline",
        configJson: JSON.stringify(DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG),
      },
    });
  }

  validateConfig(input: unknown): DeepCleanEstimatorConfigPayload {
    try {
      return parseAndValidateDeepCleanEstimatorConfig(input);
    } catch (e) {
      if (e instanceof DeepCleanEstimatorConfigValidationError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  async getActiveConfig(): Promise<DeepCleanEstimatorConfigRowDto> {
    await this.bootstrapConfigIfNeeded();
    const row = await this.prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.active },
      orderBy: { version: "desc" },
    });
    if (!row) {
      throw new NotFoundException("ACTIVE_DEEP_CLEAN_ESTIMATOR_CONFIG_NOT_FOUND");
    }
    return this.toDto(row);
  }

  /** Used by EstimatorService on each deep clean estimate. */
  async getActiveForEstimate(): Promise<ActiveTuningForEstimate | null> {
    await this.bootstrapConfigIfNeeded();
    const row = await this.prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.active },
      orderBy: { version: "desc" },
    });
    if (!row) return null;
    const config = parseAndValidateDeepCleanEstimatorConfig(JSON.parse(row.configJson));
    return {
      id: row.id,
      version: row.version,
      label: row.label,
      config,
    };
  }

  async getDraftConfig(): Promise<DeepCleanEstimatorConfigRowDto> {
    await this.bootstrapConfigIfNeeded();
    const existing = await this.prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.draft },
      orderBy: { version: "desc" },
    });
    if (existing) return this.toDto(existing);

    const active = await this.prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.active },
      orderBy: { version: "desc" },
    });
    if (!active) {
      throw new NotFoundException("ACTIVE_DEEP_CLEAN_ESTIMATOR_CONFIG_NOT_FOUND");
    }

    const version = await this.nextVersion();
    const created = await this.prisma.deepCleanEstimatorConfig.create({
      data: {
        version,
        status: DeepCleanEstimatorConfigStatus.draft,
        label: `${active.label} (draft)`,
        configJson: active.configJson,
      },
    });
    return this.toDto(created);
  }

  async updateDraftConfig(input: {
    label?: string;
    config: DeepCleanEstimatorConfigPayload;
    userId?: string | null;
  }): Promise<DeepCleanEstimatorConfigRowDto> {
    const validated = this.validateConfig(input.config);
    const draft = await this.prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.draft },
      orderBy: { version: "desc" },
    });
    if (!draft) {
      throw new NotFoundException("DRAFT_DEEP_CLEAN_ESTIMATOR_CONFIG_NOT_FOUND");
    }

    const updated = await this.prisma.deepCleanEstimatorConfig.update({
      where: { id: draft.id },
      data: {
        label: input.label?.trim() ? input.label.trim() : draft.label,
        configJson: JSON.stringify(validated),
        createdByUserId: input.userId ?? draft.createdByUserId,
      },
    });
    return this.toDto(updated);
  }

  async publishDraftConfig(input: {
    userId?: string | null;
  }): Promise<{ published: DeepCleanEstimatorConfigRowDto; newDraft: DeepCleanEstimatorConfigRowDto }> {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.deepCleanEstimatorConfig.findFirst({
        where: { status: DeepCleanEstimatorConfigStatus.draft },
        orderBy: { version: "desc" },
      });
      if (!draft) {
        throw new NotFoundException("DRAFT_DEEP_CLEAN_ESTIMATOR_CONFIG_NOT_FOUND");
      }

      await tx.deepCleanEstimatorConfig.updateMany({
        where: { status: DeepCleanEstimatorConfigStatus.active },
        data: { status: DeepCleanEstimatorConfigStatus.archived },
      });

      const published = await tx.deepCleanEstimatorConfig.update({
        where: { id: draft.id },
        data: {
          status: DeepCleanEstimatorConfigStatus.active,
          publishedAt: new Date(),
          publishedByUserId: input.userId ?? null,
        },
      });

      const nextV = await this.nextVersionInTx(tx);
      const newDraft = await tx.deepCleanEstimatorConfig.create({
        data: {
          version: nextV,
          status: DeepCleanEstimatorConfigStatus.draft,
          label: `${published.label} (draft)`,
          configJson: published.configJson,
        },
      });

      return {
        published: this.toDto(published),
        newDraft: this.toDto(newDraft),
      };
    });
  }

  private async nextVersionInTx(tx: Prisma.TransactionClient): Promise<number> {
    const agg = await tx.deepCleanEstimatorConfig.aggregate({
      _max: { version: true },
    });
    return (agg._max.version ?? 0) + 1;
  }

  private toHistoryRowDto(row: {
    id: string;
    version: number;
    status: DeepCleanEstimatorConfigStatus;
    label: string;
    publishedAt: Date | null;
    createdByUserId: string | null;
    publishedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DeepCleanEstimatorVersionHistoryRowDto {
    return {
      id: row.id,
      version: row.version,
      status: row.status,
      label: row.label,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdByUserId: row.createdByUserId,
      publishedByUserId: row.publishedByUserId,
    };
  }

  /**
   * Active first, then draft, then archived (newest → oldest by version).
   */
  async listConfigsForGovernance(): Promise<DeepCleanEstimatorVersionHistoryRowDto[]> {
    await this.bootstrapConfigIfNeeded();
    const all = await this.prisma.deepCleanEstimatorConfig.findMany({
      select: {
        id: true,
        version: true,
        status: true,
        label: true,
        publishedAt: true,
        createdByUserId: true,
        publishedByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const active = all
      .filter((r) => r.status === DeepCleanEstimatorConfigStatus.active)
      .sort((a, b) => b.version - a.version);
    const draft = all
      .filter((r) => r.status === DeepCleanEstimatorConfigStatus.draft)
      .sort((a, b) => b.version - a.version);
    const archived = all
      .filter((r) => r.status === DeepCleanEstimatorConfigStatus.archived)
      .sort((a, b) => b.version - a.version);
    return [...active, ...draft, ...archived].map((r) => this.toHistoryRowDto(r));
  }

  async getConfigDetailById(id: string): Promise<DeepCleanEstimatorVersionDetailDto> {
    await this.bootstrapConfigIfNeeded();
    const row = await this.prisma.deepCleanEstimatorConfig.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException("DEEP_CLEAN_ESTIMATOR_CONFIG_NOT_FOUND");
    }
    const dto = this.toDto(row);
    return {
      ...this.toHistoryRowDto(row),
      config: dto.config,
    };
  }

  /**
   * Copies active or archived config into the single draft row (overwrite or create draft).
   * Does not publish. Never reactivates the source row.
   */
  async restoreConfigToDraft(input: {
    sourceConfigId: string;
    actorUserId: string | null;
  }): Promise<{ draft: DeepCleanEstimatorVersionDetailDto; restoredFromVersion: number }> {
    await this.bootstrapConfigIfNeeded();
    const source = await this.prisma.deepCleanEstimatorConfig.findUnique({
      where: { id: input.sourceConfigId },
    });
    if (!source) {
      throw new NotFoundException("DEEP_CLEAN_ESTIMATOR_CONFIG_NOT_FOUND");
    }
    if (source.status === DeepCleanEstimatorConfigStatus.draft) {
      throw new BadRequestException("CANNOT_RESTORE_FROM_DRAFT");
    }

    const validated = parseAndValidateDeepCleanEstimatorConfig(JSON.parse(source.configJson));
    const restoredLabel = `Restored from v${source.version}`;

    let draftRow = await this.prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.draft },
      orderBy: { version: "desc" },
    });

    if (draftRow) {
      draftRow = await this.prisma.deepCleanEstimatorConfig.update({
        where: { id: draftRow.id },
        data: {
          label: restoredLabel,
          configJson: JSON.stringify(validated),
          createdByUserId: input.actorUserId ?? draftRow.createdByUserId,
        },
      });
    } else {
      const version = await this.nextVersion();
      draftRow = await this.prisma.deepCleanEstimatorConfig.create({
        data: {
          version,
          status: DeepCleanEstimatorConfigStatus.draft,
          label: restoredLabel,
          configJson: JSON.stringify(validated),
          createdByUserId: input.actorUserId ?? null,
        },
      });
    }

    const draft = this.toDto(draftRow);
    return {
      draft: {
        ...this.toHistoryRowDto(draftRow),
        config: draft.config,
      },
      restoredFromVersion: source.version,
    };
  }
}
