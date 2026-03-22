import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

import { PrismaService } from "../../prisma";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type DispatchConfigPayload = {
  id: string;
  version: number;
  status: "draft" | "active" | "archived";
  label: string | null;

  acceptancePenaltyWeight: string;
  completionPenaltyWeight: string;
  cancellationPenaltyWeight: string;
  loadPenaltyWeight: string;
  reliabilityBonusWeight: string;
  responseSpeedWeight: string;

  offerExpiryMinutes: number;
  assignedStartGraceMinutes: number;
  multiPassPenaltyStep: string;

  enableResponseSpeedWeighting: boolean;
  enableReliabilityWeighting: boolean;
  allowReofferAfterExpiry: boolean;

  configJson: unknown;
  createdByAdminUserId: string | null;
  publishedByAdminUserId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDispatchConfigDraftInput = {
  label?: string | null;

  acceptancePenaltyWeight?: string | number;
  completionPenaltyWeight?: string | number;
  cancellationPenaltyWeight?: string | number;
  loadPenaltyWeight?: string | number;
  reliabilityBonusWeight?: string | number;
  responseSpeedWeight?: string | number;

  offerExpiryMinutes?: number;
  assignedStartGraceMinutes?: number;
  multiPassPenaltyStep?: string | number;

  enableResponseSpeedWeighting?: boolean;
  enableReliabilityWeighting?: boolean;
  allowReofferAfterExpiry?: boolean;

  updatedByAdminUserId?: string | null;
};

export type RollbackDispatchConfigFromAuditInput = {
  auditId: string;
  updatedByAdminUserId?: string | null;
};

export type DispatchConfigDiffCategory = "weight" | "timing" | "behavior" | "json";
export type DispatchConfigChangeType = "added" | "removed" | "modified";
export type DispatchConfigImpactLevel = "low" | "medium" | "high";

export type DispatchConfigDiffItem = {
  field: string;
  category: DispatchConfigDiffCategory;
  before: unknown;
  after: unknown;
  changeType: DispatchConfigChangeType;
  impactLevel: DispatchConfigImpactLevel;
  message: string;
};

export type DispatchConfigCompareSummary = {
  changeCount: number;
  highImpactChangeCount: number;
};

export type DispatchConfigCompareResponse = {
  hasActive: boolean;
  hasChanges: boolean;
  summary: DispatchConfigCompareSummary;
  draft: {
    id: string;
    label: string | null;
    version: number;
    status: "draft" | "active" | "archived";
  };
  active: {
    id: string;
    label: string | null;
    version: number;
    status: "draft" | "active" | "archived";
  } | null;
  diffs: DispatchConfigDiffItem[];
};

export type DispatchConfigPublishPreviewResponse = {
  canPublish: boolean;
  hasChanges: boolean;
  changeCount: number;
  highImpactChangeCount: number;
  warnings: string[];
  highlights: string[];
  publishSummary: string;
  diffs: DispatchConfigDiffItem[];
};

export type DispatchConfigPublishAuditPayload = {
  id: string;
  dispatchConfigId: string;
  fromVersion: number | null;
  toVersion: number;
  publishedByAdminUserId: string | null;
  publishedAt: string;
  diffSnapshot: DispatchConfigDiffItem[];
  warningsSnapshot: string[];
  highlightsSnapshot: string[];
  publishSummary: string;
};

export type DispatchConfigPublishHistoryResponse = {
  items: DispatchConfigPublishAuditPayload[];
  nextCursor: string | null;
};

@Injectable()
export class DispatchConfigService {
  private readonly comparableWeightFields = [
    "acceptancePenaltyWeight",
    "completionPenaltyWeight",
    "cancellationPenaltyWeight",
    "loadPenaltyWeight",
    "reliabilityBonusWeight",
    "responseSpeedWeight",
  ] as const;

  private readonly comparableTimingFields = [
    "offerExpiryMinutes",
    "assignedStartGraceMinutes",
    "multiPassPenaltyStep",
  ] as const;

  private readonly comparableBehaviorFields = [
    "enableResponseSpeedWeighting",
    "enableReliabilityWeighting",
    "allowReofferAfterExpiry",
  ] as const;

  constructor(private readonly prisma: PrismaService) {}

  async getActiveConfig(): Promise<DispatchConfigPayload> {
    let active = await this.prisma.dispatchConfig.findFirst({
      where: { status: "active" },
      orderBy: { version: "desc" },
    });

    if (!active) {
      active = await this.bootstrapInitialConfig("system");
    }

    return this.mapConfig(active);
  }

  async getDraftConfig(): Promise<DispatchConfigPayload> {
    let draft = await this.prisma.dispatchConfig.findFirst({
      where: { status: "draft" },
      orderBy: { version: "desc" },
    });

    if (!draft) {
      draft = await this.ensureDraftFromActive();
    }

    return this.mapConfig(draft);
  }

  async compareDraftToActive(): Promise<DispatchConfigCompareResponse> {
    const draft = await this.getDraftConfig();
    const active = await this.getActiveConfig();
    return this.buildCompareResponseFromConfigs(active, draft);
  }

  async getPublishPreview(): Promise<DispatchConfigPublishPreviewResponse> {
    const draft = await this.getDraftConfig();
    const active = await this.getActiveConfig();
    const compare = this.buildCompareResponseFromConfigs(active, draft);
    return this.buildPublishPreviewResponse(compare, draft);
  }

  async getPublishHistory(args?: {
    limit?: number;
    cursor?: string | null;
  }): Promise<DispatchConfigPublishHistoryResponse> {
    const limit = Math.min(Math.max(args?.limit ?? 25, 1), 100);
    const audits = await this.prisma.dispatchConfigPublishAudit.findMany({
      orderBy: [{ publishedAt: "desc" }, { toVersion: "desc" }],
      take: limit + 1,
      ...(args?.cursor
        ? { cursor: { id: args.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = audits.length > limit;
    const page = hasMore ? audits.slice(0, limit) : audits;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      items: page.map((audit) => this.mapPublishAudit(audit)),
      nextCursor,
    };
  }

  async getLatestPublishAudit(): Promise<DispatchConfigPublishAuditPayload> {
    const audit = await this.prisma.dispatchConfigPublishAudit.findFirst({
      orderBy: [{ publishedAt: "desc" }, { toVersion: "desc" }],
    });

    if (!audit) {
      throw new NotFoundException("Dispatch config publish audit not found");
    }

    return this.mapPublishAudit(audit);
  }

  async getPublishAuditById(
    auditId: string,
  ): Promise<DispatchConfigPublishAuditPayload> {
    const audit = await this.prisma.dispatchConfigPublishAudit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new NotFoundException("Dispatch config publish audit not found");
    }

    return this.mapPublishAudit(audit);
  }

  async rollbackDraftFromAudit(
    input: RollbackDispatchConfigFromAuditInput,
  ): Promise<DispatchConfigPayload> {
    if (!input.auditId || typeof input.auditId !== "string") {
      throw new BadRequestException("auditId is required");
    }

    return this.prisma.$transaction(async (tx) => {
      const audit = await tx.dispatchConfigPublishAudit.findUnique({
        where: { id: input.auditId },
      });

      if (!audit) {
        throw new NotFoundException("Dispatch config publish audit not found");
      }

      const sourceConfig = await tx.dispatchConfig.findUnique({
        where: { id: audit.dispatchConfigId },
      });

      if (!sourceConfig) {
        throw new NotFoundException("Dispatch config for publish audit not found");
      }

      let draft = await tx.dispatchConfig.findFirst({
        where: { status: "draft" },
        orderBy: { version: "desc" },
      });

      if (!draft) {
        const active = await tx.dispatchConfig.findFirst({
          where: { status: "active" },
          orderBy: { version: "desc" },
        });

        if (!active) {
          throw new NotFoundException("Active dispatch config not found");
        }

        draft = await this.createDraftFromConfigTx(
          tx,
          active,
          input.updatedByAdminUserId ?? null,
        );
      }

      const rollbackLabel = `Rollback draft from v${sourceConfig.version}`;

      const next = {
        label: rollbackLabel,
        acceptancePenaltyWeight: sourceConfig.acceptancePenaltyWeight,
        completionPenaltyWeight: sourceConfig.completionPenaltyWeight,
        cancellationPenaltyWeight: sourceConfig.cancellationPenaltyWeight,
        loadPenaltyWeight: sourceConfig.loadPenaltyWeight,
        reliabilityBonusWeight: sourceConfig.reliabilityBonusWeight,
        responseSpeedWeight: sourceConfig.responseSpeedWeight,
        offerExpiryMinutes: sourceConfig.offerExpiryMinutes,
        assignedStartGraceMinutes: sourceConfig.assignedStartGraceMinutes,
        multiPassPenaltyStep: sourceConfig.multiPassPenaltyStep,
        enableResponseSpeedWeighting: sourceConfig.enableResponseSpeedWeighting,
        enableReliabilityWeighting: sourceConfig.enableReliabilityWeighting,
        allowReofferAfterExpiry: sourceConfig.allowReofferAfterExpiry,
      };

      this.validateConfig(next);

      const updated = await tx.dispatchConfig.update({
        where: { id: draft.id },
        data: {
          ...next,
          configJson: this.buildConfigJson(next),
          createdByAdminUserId: input.updatedByAdminUserId ?? draft.createdByAdminUserId,
        },
      });

      return this.mapConfig(updated);
    });
  }

  async updateDraftConfig(
    input: UpdateDispatchConfigDraftInput,
  ): Promise<DispatchConfigPayload> {
    const draft = await this.ensureDraftFromActive();

    const next = {
      label: input.label === undefined ? draft.label : input.label,
      acceptancePenaltyWeight:
        input.acceptancePenaltyWeight === undefined
          ? draft.acceptancePenaltyWeight
          : this.toDecimal(input.acceptancePenaltyWeight),
      completionPenaltyWeight:
        input.completionPenaltyWeight === undefined
          ? draft.completionPenaltyWeight
          : this.toDecimal(input.completionPenaltyWeight),
      cancellationPenaltyWeight:
        input.cancellationPenaltyWeight === undefined
          ? draft.cancellationPenaltyWeight
          : this.toDecimal(input.cancellationPenaltyWeight),
      loadPenaltyWeight:
        input.loadPenaltyWeight === undefined
          ? draft.loadPenaltyWeight
          : this.toDecimal(input.loadPenaltyWeight),
      reliabilityBonusWeight:
        input.reliabilityBonusWeight === undefined
          ? draft.reliabilityBonusWeight
          : this.toDecimal(input.reliabilityBonusWeight),
      responseSpeedWeight:
        input.responseSpeedWeight === undefined
          ? draft.responseSpeedWeight
          : this.toDecimal(input.responseSpeedWeight),
      offerExpiryMinutes:
        input.offerExpiryMinutes === undefined
          ? draft.offerExpiryMinutes
          : input.offerExpiryMinutes,
      assignedStartGraceMinutes:
        input.assignedStartGraceMinutes === undefined
          ? draft.assignedStartGraceMinutes
          : input.assignedStartGraceMinutes,
      multiPassPenaltyStep:
        input.multiPassPenaltyStep === undefined
          ? draft.multiPassPenaltyStep
          : this.toDecimal(input.multiPassPenaltyStep),
      enableResponseSpeedWeighting:
        input.enableResponseSpeedWeighting === undefined
          ? draft.enableResponseSpeedWeighting
          : input.enableResponseSpeedWeighting,
      enableReliabilityWeighting:
        input.enableReliabilityWeighting === undefined
          ? draft.enableReliabilityWeighting
          : input.enableReliabilityWeighting,
      allowReofferAfterExpiry:
        input.allowReofferAfterExpiry === undefined
          ? draft.allowReofferAfterExpiry
          : input.allowReofferAfterExpiry,
    };

    this.validateConfig(next);

    const updated = await this.prisma.dispatchConfig.update({
      where: { id: draft.id },
      data: {
        ...next,
        configJson: this.buildConfigJson(next),
      },
    });

    return this.mapConfig(updated);
  }

  async publishDraftConfig(adminUserId?: string | null): Promise<DispatchConfigPayload> {
    return this.prisma
      .$transaction(async (tx) => {
        const previousActive = await tx.dispatchConfig.findFirst({
          where: { status: "active" },
          orderBy: { version: "desc" },
        });

        const draft = await tx.dispatchConfig.findFirst({
          where: { status: "draft" },
          orderBy: { version: "desc" },
        });

        if (!draft) {
          throw new NotFoundException("Draft dispatch config not found");
        }

        this.validateConfig(draft);

        if (!previousActive) {
          throw new NotFoundException("Active dispatch config not found");
        }

        const previousActivePayload = this.mapConfig(previousActive);
        const draftPayload = this.mapConfig(draft);

        const compare = this.buildCompareResponseFromConfigs(
          previousActivePayload,
          draftPayload,
        );
        const preview = this.buildPublishPreviewResponse(compare, draftPayload);

        await tx.dispatchConfig.updateMany({
          where: { status: "active" },
          data: { status: "archived" },
        });

        const publishedAt = new Date();

        const published = await tx.dispatchConfig.update({
          where: { id: draft.id },
          data: {
            status: "active",
            publishedByAdminUserId: adminUserId ?? null,
            publishedAt,
          },
        });

        await tx.dispatchConfigPublishAudit.create({
          data: {
            dispatchConfigId: published.id,
            fromVersion: previousActive.version ?? null,
            toVersion: published.version,
            publishedByAdminUserId: adminUserId ?? null,
            publishedAt,
            diffSnapshot: compare.diffs as unknown as Prisma.InputJsonValue,
            warningsSnapshot: preview.warnings as unknown as Prisma.InputJsonValue,
            highlightsSnapshot:
              preview.highlights as unknown as Prisma.InputJsonValue,
            publishSummary: preview.publishSummary,
          },
        });

        await this.createDraftFromConfigTx(tx, published, adminUserId ?? null);

        return published;
      })
      .then((cfg) => this.mapConfig(cfg));
  }

  async getEngineConfig() {
    const active = await this.getActiveConfig();

    return {
      scoringVersion: `dispatch-config-v${active.version}`,
      acceptancePenaltyWeight: Number(active.acceptancePenaltyWeight),
      completionPenaltyWeight: Number(active.completionPenaltyWeight),
      cancellationPenaltyWeight: Number(active.cancellationPenaltyWeight),
      loadPenaltyWeight: Number(active.loadPenaltyWeight),
      reliabilityBonusWeight: Number(active.reliabilityBonusWeight),
      responseSpeedWeight: Number(active.responseSpeedWeight),
      offerExpiryMinutes: active.offerExpiryMinutes,
      assignedStartGraceMinutes: active.assignedStartGraceMinutes,
      multiPassPenaltyStep: Number(active.multiPassPenaltyStep),
      enableResponseSpeedWeighting: active.enableResponseSpeedWeighting,
      enableReliabilityWeighting: active.enableReliabilityWeighting,
      allowReofferAfterExpiry: active.allowReofferAfterExpiry,
    };
  }

  private normalizeConfigJsonForCompare(value: unknown): unknown {
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
      return value;
    }
    const obj = value as Record<string, unknown>;
    const { label: _label, ...rest } = obj;
    return rest;
  }

  private buildComparableShape(config: DispatchConfigPayload) {
    return {
      acceptancePenaltyWeight: Number(config.acceptancePenaltyWeight),
      completionPenaltyWeight: Number(config.completionPenaltyWeight),
      cancellationPenaltyWeight: Number(config.cancellationPenaltyWeight),
      loadPenaltyWeight: Number(config.loadPenaltyWeight),
      reliabilityBonusWeight: Number(config.reliabilityBonusWeight),
      responseSpeedWeight: Number(config.responseSpeedWeight),
      offerExpiryMinutes: config.offerExpiryMinutes,
      assignedStartGraceMinutes: config.assignedStartGraceMinutes,
      multiPassPenaltyStep: Number(config.multiPassPenaltyStep),
      enableResponseSpeedWeighting: config.enableResponseSpeedWeighting,
      enableReliabilityWeighting: config.enableReliabilityWeighting,
      allowReofferAfterExpiry: config.allowReofferAfterExpiry,
      configJson: config.configJson ?? null,
    };
  }

  private buildDiffs(
    active: DispatchConfigPayload,
    draft: DispatchConfigPayload,
  ): DispatchConfigDiffItem[] {
    const beforeShape = this.buildComparableShape(active);
    const afterShape = this.buildComparableShape(draft);

    const diffs: DispatchConfigDiffItem[] = [];

    for (const field of this.comparableWeightFields) {
      if (beforeShape[field] !== afterShape[field]) {
        diffs.push(
          this.createDiffItem(field, "weight", beforeShape[field], afterShape[field]),
        );
      }
    }

    for (const field of this.comparableTimingFields) {
      if (beforeShape[field] !== afterShape[field]) {
        diffs.push(
          this.createDiffItem(field, "timing", beforeShape[field], afterShape[field]),
        );
      }
    }

    for (const field of this.comparableBehaviorFields) {
      if (beforeShape[field] !== afterShape[field]) {
        diffs.push(
          this.createDiffItem(field, "behavior", beforeShape[field], afterShape[field]),
        );
      }
    }

    const beforeJsonNorm = this.normalizeConfigJsonForCompare(beforeShape.configJson);
    const afterJsonNorm = this.normalizeConfigJsonForCompare(afterShape.configJson);
    if (JSON.stringify(beforeJsonNorm) !== JSON.stringify(afterJsonNorm)) {
      diffs.push(
        this.createDiffItem(
          "configJson",
          "json",
          beforeShape.configJson,
          afterShape.configJson,
        ),
      );
    }

    return diffs;
  }

  private createDiffItem(
    field: string,
    category: DispatchConfigDiffCategory,
    before: unknown,
    after: unknown,
  ): DispatchConfigDiffItem {
    return {
      field,
      category,
      before,
      after,
      changeType: this.getChangeType(before, after),
      impactLevel: this.getImpactLevel(field, category, before, after),
      message: this.getDiffMessage(field, before, after),
    };
  }

  private getChangeType(
    before: unknown,
    after: unknown,
  ): DispatchConfigChangeType {
    if (before == null && after != null) {
      return "added";
    }

    if (before != null && after == null) {
      return "removed";
    }

    return "modified";
  }

  private getImpactLevel(
    field: string,
    category: DispatchConfigDiffCategory,
    before: unknown,
    after: unknown,
  ): DispatchConfigImpactLevel {
    if (category === "timing" || category === "behavior" || category === "json") {
      return "high";
    }

    if (category === "weight") {
      const beforeNum = Number(before);
      const afterNum = Number(after);

      if ((beforeNum === 0 && afterNum > 0) || (beforeNum > 0 && afterNum === 0)) {
        return "high";
      }

      if (beforeNum !== 0) {
        const relativeDelta = Math.abs(afterNum - beforeNum) / Math.abs(beforeNum);
        if (relativeDelta >= 0.25) {
          return "high";
        }
      }

      return "medium";
    }

    return "low";
  }

  private getDiffMessage(field: string, before: unknown, after: unknown): string {
    switch (field) {
      case "acceptancePenaltyWeight":
        return `Acceptance penalty weight changed from ${before} to ${after}, so acceptance behavior will influence dispatch ranking differently.`;
      case "completionPenaltyWeight":
        return `Completion penalty weight changed from ${before} to ${after}, so completion history will influence dispatch ranking differently.`;
      case "cancellationPenaltyWeight":
        return `Cancellation penalty weight changed from ${before} to ${after}, so cancellation history will influence dispatch ranking differently.`;
      case "loadPenaltyWeight":
        return `Load penalty weight changed from ${before} to ${after}, so current cleaner load will influence dispatch ranking differently.`;
      case "reliabilityBonusWeight":
        return `Reliability bonus weight changed from ${before} to ${after}, so reliability performance will influence dispatch ranking differently.`;
      case "responseSpeedWeight":
        return `Response speed weight changed from ${before} to ${after}, so response speed will influence dispatch ranking differently.`;
      case "offerExpiryMinutes":
        return `Offer expiry changed from ${before} to ${after} minutes, changing how long cleaners have to accept dispatch offers.`;
      case "assignedStartGraceMinutes":
        return `Assigned start grace changed from ${before} to ${after} minutes, changing when missed-start redispatch protections trigger.`;
      case "multiPassPenaltyStep":
        return `Multi-pass penalty step changed from ${before} to ${after}, changing how aggressively repeated dispatch passes penalize candidates.`;
      case "enableResponseSpeedWeighting":
        return `Response speed weighting changed from ${this.formatEnabledDisabled(before)} to ${this.formatEnabledDisabled(after)}.`;
      case "enableReliabilityWeighting":
        return `Reliability weighting changed from ${this.formatEnabledDisabled(before)} to ${this.formatEnabledDisabled(after)}.`;
      case "allowReofferAfterExpiry":
        return `Allow reoffer after expiry changed from ${this.formatEnabledDisabled(before)} to ${this.formatEnabledDisabled(after)}, changing whether expired offers can be reissued automatically.`;
      case "configJson":
        return "Advanced config JSON changed, which may alter dispatch behavior outside the primary admin tuning fields.";
      default:
        return `${field} changed from ${before} to ${after}.`;
    }
  }

  private formatEnabledDisabled(value: unknown): string {
    return value ? "enabled" : "disabled";
  }

  private buildCompareSummary(
    diffs: DispatchConfigDiffItem[],
  ): DispatchConfigCompareSummary {
    return {
      changeCount: diffs.length,
      highImpactChangeCount: diffs.filter((d) => d.impactLevel === "high").length,
    };
  }

  private buildCompareResponseFromConfigs(
    active: DispatchConfigPayload,
    draft: DispatchConfigPayload,
  ): DispatchConfigCompareResponse {
    const diffs = this.buildDiffs(active, draft);

    return {
      hasActive: true,
      hasChanges: diffs.length > 0,
      summary: this.buildCompareSummary(diffs),
      draft: {
        id: draft.id,
        label: draft.label,
        version: draft.version,
        status: draft.status,
      },
      active: {
        id: active.id,
        label: active.label,
        version: active.version,
        status: active.status,
      },
      diffs,
    };
  }

  private buildPublishPreviewResponse(
    compare: DispatchConfigCompareResponse,
    draft: DispatchConfigPayload,
  ): DispatchConfigPublishPreviewResponse {
    const warnings = this.buildPreviewWarnings(compare, draft);
    const highlights = this.buildPreviewHighlights(compare);
    const publishSummary = this.buildPublishSummary(compare, warnings, highlights);

    return {
      canPublish: compare.hasChanges,
      hasChanges: compare.hasChanges,
      changeCount: compare.summary.changeCount,
      highImpactChangeCount: compare.summary.highImpactChangeCount,
      warnings,
      highlights,
      publishSummary,
      diffs: compare.diffs,
    };
  }

  private buildPreviewWarnings(
    compare: DispatchConfigCompareResponse,
    draft: DispatchConfigPayload,
  ): string[] {
    const warnings: string[] = [];

    if (!compare.hasChanges) {
      warnings.push(
        "This draft has no changes compared with the active dispatch config.",
      );
    }

    if (draft.offerExpiryMinutes < 2) {
      warnings.push(
        "Offer expiry is set below 2 minutes and may cause avoidable offer expirations.",
      );
    }

    if (draft.assignedStartGraceMinutes < 5) {
      warnings.push(
        "Assigned start grace is set below 5 minutes and may trigger redispatch too aggressively.",
      );
    }

    if (Number(draft.multiPassPenaltyStep) > 25) {
      warnings.push(
        "Multi-pass penalty step is set above 25 and may over-penalize candidates across redispatch rounds.",
      );
    }

    if (
      draft.enableResponseSpeedWeighting &&
      Number(draft.responseSpeedWeight) === 0
    ) {
      warnings.push(
        "Response speed weighting is enabled, but response speed weight is 0, so the feature is effectively inactive.",
      );
    }

    if (
      draft.enableReliabilityWeighting &&
      Number(draft.reliabilityBonusWeight) === 0
    ) {
      warnings.push(
        "Reliability weighting is enabled, but reliability bonus weight is 0, so the feature is effectively inactive.",
      );
    }

    const weights = [
      Number(draft.acceptancePenaltyWeight),
      Number(draft.completionPenaltyWeight),
      Number(draft.cancellationPenaltyWeight),
      Number(draft.loadPenaltyWeight),
      Number(draft.reliabilityBonusWeight),
      Number(draft.responseSpeedWeight),
    ];

    const totalWeight = weights.reduce((sum, value) => sum + value, 0);

    if (totalWeight === 0) {
      warnings.push(
        "All dispatch weights are 0, so ranking behavior may collapse toward base estimator ordering.",
      );
    } else {
      if (totalWeight < 0.5) {
        warnings.push(
          "All dispatch weights are extremely low, so score adjustments may have very limited effect.",
        );
      }

      const dominantRatio = Math.max(...weights) / totalWeight;
      if (dominantRatio > 0.7) {
        warnings.push(
          "One dispatch weight dominates more than 70% of total weight mass, which may make ranking behavior overly sensitive to a single factor.",
        );
      }
    }

    if (!draft.allowReofferAfterExpiry) {
      warnings.push(
        "Reoffer after expiry is disabled, so expired offers will not be automatically reissued.",
      );
    }

    return warnings;
  }

  private buildPreviewHighlights(
    compare: DispatchConfigCompareResponse,
  ): string[] {
    const highlights: string[] = [];

    const getDiff = (field: string) => compare.diffs.find((d) => d.field === field);

    const responseSpeedWeightDiff = getDiff("responseSpeedWeight");
    const responseSpeedToggleDiff = getDiff("enableResponseSpeedWeighting");
    const reliabilityWeightDiff = getDiff("reliabilityBonusWeight");
    const reliabilityToggleDiff = getDiff("enableReliabilityWeighting");
    const loadWeightDiff = getDiff("loadPenaltyWeight");
    const offerExpiryDiff = getDiff("offerExpiryMinutes");
    const assignedStartGraceDiff = getDiff("assignedStartGraceMinutes");
    const reofferDiff = getDiff("allowReofferAfterExpiry");

    if (reofferDiff?.after === false) {
      highlights.push("Expired offers will no longer be reissued automatically.");
    } else if (reofferDiff?.after === true) {
      highlights.push("Expired offers can continue to be reissued automatically.");
    }

    if (
      (responseSpeedWeightDiff &&
        Number(responseSpeedWeightDiff.after) > Number(responseSpeedWeightDiff.before)) ||
      (responseSpeedToggleDiff && responseSpeedToggleDiff.after === true)
    ) {
      highlights.push("Cleaner responsiveness will matter more after publish.");
    } else if (
      (responseSpeedWeightDiff &&
        Number(responseSpeedWeightDiff.after) < Number(responseSpeedWeightDiff.before)) ||
      (responseSpeedToggleDiff && responseSpeedToggleDiff.after === false)
    ) {
      highlights.push("Cleaner responsiveness will matter less after publish.");
    }

    if (
      (reliabilityWeightDiff &&
        Number(reliabilityWeightDiff.after) > Number(reliabilityWeightDiff.before)) ||
      (reliabilityToggleDiff && reliabilityToggleDiff.after === true)
    ) {
      highlights.push("Reliability-based ranking pressure will increase.");
    } else if (
      (reliabilityWeightDiff &&
        Number(reliabilityWeightDiff.after) < Number(reliabilityWeightDiff.before)) ||
      (reliabilityToggleDiff && reliabilityToggleDiff.after === false)
    ) {
      highlights.push("Reliability-based ranking pressure will decrease.");
    }

    if (
      loadWeightDiff &&
      Number(loadWeightDiff.after) > Number(loadWeightDiff.before)
    ) {
      highlights.push("Load balancing pressure will increase.");
    } else if (
      loadWeightDiff &&
      Number(loadWeightDiff.after) < Number(loadWeightDiff.before)
    ) {
      highlights.push("Load balancing pressure will decrease.");
    }

    if (
      offerExpiryDiff &&
      Number(offerExpiryDiff.after) < Number(offerExpiryDiff.before)
    ) {
      highlights.push("Cleaners will have less time to accept offers.");
    } else if (
      offerExpiryDiff &&
      Number(offerExpiryDiff.after) > Number(offerExpiryDiff.before)
    ) {
      highlights.push("Cleaners will have more time to accept offers.");
    }

    if (
      assignedStartGraceDiff &&
      Number(assignedStartGraceDiff.after) < Number(assignedStartGraceDiff.before)
    ) {
      highlights.push("Missed-start redispatch protection will trigger sooner.");
    } else     if (
      assignedStartGraceDiff &&
      Number(assignedStartGraceDiff.after) > Number(assignedStartGraceDiff.before)
    ) {
      highlights.push("Missed-start redispatch protection will allow more grace time.");
    }

    if (!compare.hasChanges) {
      highlights.push("Publishing now would not change live dispatch behavior.");
    }

    return Array.from(new Set(highlights)).slice(0, 6);
  }

  private buildPublishSummary(
    compare: DispatchConfigCompareResponse,
    warnings: string[],
    highlights: string[],
  ): string {
    if (!compare.hasChanges) {
      return "This draft does not change live dispatch behavior.";
    }

    let summary = `Publishing this draft will update live dispatch behavior across ${compare.summary.changeCount} changed fields, including ${compare.summary.highImpactChangeCount} high-impact changes.`;

    const topHighlights = highlights
      .filter((h) => h !== "Publishing now would not change live dispatch behavior.")
      .slice(0, 2);

    if (topHighlights.length > 0) {
      summary += ` Key expected effects: ${topHighlights.join(" ")}`;
    }

    return summary;
  }

  private mapPublishAudit(audit: {
    id: string;
    dispatchConfigId: string;
    fromVersion: number | null;
    toVersion: number;
    publishedByAdminUserId: string | null;
    publishedAt: Date;
    diffSnapshot: Prisma.JsonValue;
    warningsSnapshot: Prisma.JsonValue;
    highlightsSnapshot: Prisma.JsonValue;
    publishSummary: string;
  }): DispatchConfigPublishAuditPayload {
    return {
      id: audit.id,
      dispatchConfigId: audit.dispatchConfigId,
      fromVersion: audit.fromVersion,
      toVersion: audit.toVersion,
      publishedByAdminUserId: audit.publishedByAdminUserId,
      publishedAt: audit.publishedAt.toISOString(),
      diffSnapshot: Array.isArray(audit.diffSnapshot)
        ? (audit.diffSnapshot as DispatchConfigDiffItem[])
        : [],
      warningsSnapshot: Array.isArray(audit.warningsSnapshot)
        ? (audit.warningsSnapshot as string[])
        : [],
      highlightsSnapshot: Array.isArray(audit.highlightsSnapshot)
        ? (audit.highlightsSnapshot as string[])
        : [],
      publishSummary: audit.publishSummary,
    };
  }

  private async bootstrapInitialConfig(
    createdByAdminUserId?: string | null,
  ) {
    const existingActive = await this.prisma.dispatchConfig.findFirst({
      where: { status: "active" },
      orderBy: { version: "desc" },
    });

    if (existingActive) {
      return existingActive;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const active = await tx.dispatchConfig.create({
        data: {
          version: 1,
          status: "active",
          label: "Initial active dispatch config",
          acceptancePenaltyWeight: new Prisma.Decimal("1.0000"),
          completionPenaltyWeight: new Prisma.Decimal("1.0000"),
          cancellationPenaltyWeight: new Prisma.Decimal("1.0000"),
          loadPenaltyWeight: new Prisma.Decimal("1.0000"),
          reliabilityBonusWeight: new Prisma.Decimal("1.0000"),
          responseSpeedWeight: new Prisma.Decimal("1.0000"),
          offerExpiryMinutes: 5,
          assignedStartGraceMinutes: 15,
          multiPassPenaltyStep: new Prisma.Decimal("10.0000"),
          enableResponseSpeedWeighting: true,
          enableReliabilityWeighting: true,
          allowReofferAfterExpiry: true,
          configJson: this.buildConfigJson({
            acceptancePenaltyWeight: new Prisma.Decimal("1.0000"),
            completionPenaltyWeight: new Prisma.Decimal("1.0000"),
            cancellationPenaltyWeight: new Prisma.Decimal("1.0000"),
            loadPenaltyWeight: new Prisma.Decimal("1.0000"),
            reliabilityBonusWeight: new Prisma.Decimal("1.0000"),
            responseSpeedWeight: new Prisma.Decimal("1.0000"),
            offerExpiryMinutes: 5,
            assignedStartGraceMinutes: 15,
            multiPassPenaltyStep: new Prisma.Decimal("10.0000"),
            enableResponseSpeedWeighting: true,
            enableReliabilityWeighting: true,
            allowReofferAfterExpiry: true,
            label: "Initial active dispatch config",
          }),
          createdByAdminUserId: createdByAdminUserId ?? null,
          publishedByAdminUserId: createdByAdminUserId ?? null,
          publishedAt: new Date(),
        },
      });

      await this.createDraftFromConfigTx(tx, active, createdByAdminUserId ?? null);

      return active;
    });

    return created;
  }

  private async ensureDraftFromActive() {
    const existingDraft = await this.prisma.dispatchConfig.findFirst({
      where: { status: "draft" },
      orderBy: { version: "desc" },
    });

    if (existingDraft) {
      return existingDraft;
    }

    const active = await this.prisma.dispatchConfig.findFirst({
      where: { status: "active" },
      orderBy: { version: "desc" },
    });

    if (!active) {
      await this.bootstrapInitialConfig("system");
      return (await this.prisma.dispatchConfig.findFirst({
        where: { status: "draft" },
        orderBy: { version: "desc" },
      }))!;
    }

    return this.prisma.$transaction(async (tx) => {
      return this.createDraftFromConfigTx(tx, active, null);
    });
  }

  private async createDraftFromConfigTx(
    tx: TxClient,
    base: {
      version: number;
      label: string | null;
      acceptancePenaltyWeight: Prisma.Decimal;
      completionPenaltyWeight: Prisma.Decimal;
      cancellationPenaltyWeight: Prisma.Decimal;
      loadPenaltyWeight: Prisma.Decimal;
      reliabilityBonusWeight: Prisma.Decimal;
      responseSpeedWeight: Prisma.Decimal;
      offerExpiryMinutes: number;
      assignedStartGraceMinutes: number;
      multiPassPenaltyStep: Prisma.Decimal;
      enableResponseSpeedWeighting: boolean;
      enableReliabilityWeighting: boolean;
      allowReofferAfterExpiry: boolean;
    },
    createdByAdminUserId?: string | null,
  ) {
    const maxVersion = await tx.dispatchConfig.aggregate({
      _max: { version: true },
    });

    const version = (maxVersion._max.version ?? 0) + 1;

    return tx.dispatchConfig.create({
      data: {
        version,
        status: "draft",
        label: `Draft from v${base.version}`,
        acceptancePenaltyWeight: base.acceptancePenaltyWeight,
        completionPenaltyWeight: base.completionPenaltyWeight,
        cancellationPenaltyWeight: base.cancellationPenaltyWeight,
        loadPenaltyWeight: base.loadPenaltyWeight,
        reliabilityBonusWeight: base.reliabilityBonusWeight,
        responseSpeedWeight: base.responseSpeedWeight,
        offerExpiryMinutes: base.offerExpiryMinutes,
        assignedStartGraceMinutes: base.assignedStartGraceMinutes,
        multiPassPenaltyStep: base.multiPassPenaltyStep,
        enableResponseSpeedWeighting: base.enableResponseSpeedWeighting,
        enableReliabilityWeighting: base.enableReliabilityWeighting,
        allowReofferAfterExpiry: base.allowReofferAfterExpiry,
        configJson: this.buildConfigJson({
          label: `Draft from v${base.version}`,
          acceptancePenaltyWeight: base.acceptancePenaltyWeight,
          completionPenaltyWeight: base.completionPenaltyWeight,
          cancellationPenaltyWeight: base.cancellationPenaltyWeight,
          loadPenaltyWeight: base.loadPenaltyWeight,
          reliabilityBonusWeight: base.reliabilityBonusWeight,
          responseSpeedWeight: base.responseSpeedWeight,
          offerExpiryMinutes: base.offerExpiryMinutes,
          assignedStartGraceMinutes: base.assignedStartGraceMinutes,
          multiPassPenaltyStep: base.multiPassPenaltyStep,
          enableResponseSpeedWeighting: base.enableResponseSpeedWeighting,
          enableReliabilityWeighting: base.enableReliabilityWeighting,
          allowReofferAfterExpiry: base.allowReofferAfterExpiry,
        }),
        createdByAdminUserId: createdByAdminUserId ?? null,
      },
    });
  }

  private buildConfigJson(input: {
    label?: string | null;
    acceptancePenaltyWeight: Prisma.Decimal;
    completionPenaltyWeight: Prisma.Decimal;
    cancellationPenaltyWeight: Prisma.Decimal;
    loadPenaltyWeight: Prisma.Decimal;
    reliabilityBonusWeight: Prisma.Decimal;
    responseSpeedWeight: Prisma.Decimal;
    offerExpiryMinutes: number;
    assignedStartGraceMinutes: number;
    multiPassPenaltyStep: Prisma.Decimal;
    enableResponseSpeedWeighting: boolean;
    enableReliabilityWeighting: boolean;
    allowReofferAfterExpiry: boolean;
  }): Prisma.InputJsonValue {
    return {
      label: input.label ?? null,
      acceptancePenaltyWeight: input.acceptancePenaltyWeight.toString(),
      completionPenaltyWeight: input.completionPenaltyWeight.toString(),
      cancellationPenaltyWeight: input.cancellationPenaltyWeight.toString(),
      loadPenaltyWeight: input.loadPenaltyWeight.toString(),
      reliabilityBonusWeight: input.reliabilityBonusWeight.toString(),
      responseSpeedWeight: input.responseSpeedWeight.toString(),
      offerExpiryMinutes: input.offerExpiryMinutes,
      assignedStartGraceMinutes: input.assignedStartGraceMinutes,
      multiPassPenaltyStep: input.multiPassPenaltyStep.toString(),
      enableResponseSpeedWeighting: input.enableResponseSpeedWeighting,
      enableReliabilityWeighting: input.enableReliabilityWeighting,
      allowReofferAfterExpiry: input.allowReofferAfterExpiry,
    };
  }

  private validateConfig(input: {
    acceptancePenaltyWeight: Prisma.Decimal;
    completionPenaltyWeight: Prisma.Decimal;
    cancellationPenaltyWeight: Prisma.Decimal;
    loadPenaltyWeight: Prisma.Decimal;
    reliabilityBonusWeight: Prisma.Decimal;
    responseSpeedWeight: Prisma.Decimal;
    offerExpiryMinutes: number;
    assignedStartGraceMinutes: number;
    multiPassPenaltyStep: Prisma.Decimal;
  }) {
    const decimals = [
      ["acceptancePenaltyWeight", input.acceptancePenaltyWeight],
      ["completionPenaltyWeight", input.completionPenaltyWeight],
      ["cancellationPenaltyWeight", input.cancellationPenaltyWeight],
      ["loadPenaltyWeight", input.loadPenaltyWeight],
      ["reliabilityBonusWeight", input.reliabilityBonusWeight],
      ["responseSpeedWeight", input.responseSpeedWeight],
      ["multiPassPenaltyStep", input.multiPassPenaltyStep],
    ] as const;

    for (const [name, value] of decimals) {
      if (value.lt(0) || value.gt(100)) {
        throw new BadRequestException(`${name} must be between 0 and 100`);
      }
    }

    if (input.offerExpiryMinutes < 1 || input.offerExpiryMinutes > 120) {
      throw new BadRequestException("offerExpiryMinutes must be between 1 and 120");
    }

    if (
      input.assignedStartGraceMinutes < 1 ||
      input.assignedStartGraceMinutes > 240
    ) {
      throw new BadRequestException(
        "assignedStartGraceMinutes must be between 1 and 240",
      );
    }
  }

  private toDecimal(value: string | number): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }

  private mapConfig(config: {
    id: string;
    version: number;
    status: string;
    label: string | null;
    acceptancePenaltyWeight: Prisma.Decimal;
    completionPenaltyWeight: Prisma.Decimal;
    cancellationPenaltyWeight: Prisma.Decimal;
    loadPenaltyWeight: Prisma.Decimal;
    reliabilityBonusWeight: Prisma.Decimal;
    responseSpeedWeight: Prisma.Decimal;
    offerExpiryMinutes: number;
    assignedStartGraceMinutes: number;
    multiPassPenaltyStep: Prisma.Decimal;
    enableResponseSpeedWeighting: boolean;
    enableReliabilityWeighting: boolean;
    allowReofferAfterExpiry: boolean;
    configJson: unknown;
    createdByAdminUserId: string | null;
    publishedByAdminUserId: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): DispatchConfigPayload {
    return {
      id: config.id,
      version: config.version,
      status: config.status as "draft" | "active" | "archived",
      label: config.label ?? null,
      acceptancePenaltyWeight: config.acceptancePenaltyWeight.toString(),
      completionPenaltyWeight: config.completionPenaltyWeight.toString(),
      cancellationPenaltyWeight: config.cancellationPenaltyWeight.toString(),
      loadPenaltyWeight: config.loadPenaltyWeight.toString(),
      reliabilityBonusWeight: config.reliabilityBonusWeight.toString(),
      responseSpeedWeight: config.responseSpeedWeight.toString(),
      offerExpiryMinutes: config.offerExpiryMinutes,
      assignedStartGraceMinutes: config.assignedStartGraceMinutes,
      multiPassPenaltyStep: config.multiPassPenaltyStep.toString(),
      enableResponseSpeedWeighting: config.enableResponseSpeedWeighting,
      enableReliabilityWeighting: config.enableReliabilityWeighting,
      allowReofferAfterExpiry: config.allowReofferAfterExpiry,
      configJson: config.configJson,
      createdByAdminUserId: config.createdByAdminUserId ?? null,
      publishedByAdminUserId: config.publishedByAdminUserId ?? null,
      publishedAt: config.publishedAt?.toISOString() ?? null,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
