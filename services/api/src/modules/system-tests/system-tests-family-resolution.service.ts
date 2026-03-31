import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma";
import type { SystemTestResolutionDto } from "./dto/system-test-resolution.dto";
import { SystemTestsDiagnosisService } from "./system-tests-diagnosis.service";
import { SystemTestsFixService } from "./system-tests-fix.service";

/**
 * Phase 10A family resolution (diagnosis + recommendations). Extracted so list/read paths
 * can reuse it without importing {@link SystemTestsService} (avoids module cycles).
 */
@Injectable()
export class SystemTestsFamilyResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemTestsDiagnosisService: SystemTestsDiagnosisService,
    private readonly systemTestsFixService: SystemTestsFixService,
  ) {}

  async getFamilyResolution(familyId: string): Promise<SystemTestResolutionDto> {
    const family = await this.prisma.systemTestFailureFamily.findUnique({
      where: { id: familyId },
      include: {
        memberships: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { failureGroup: true },
        },
      },
    });

    if (!family) {
      throw new NotFoundException(`System test failure family ${familyId} not found`);
    }

    const groups = family.memberships.map((m) => m.failureGroup);

    const failureMessages: string[] = [];
    for (const line of [
      this.readString(family, ["rootCauseSummary"]),
      this.readString(family, ["primaryLocator"]),
      this.readString(family, ["primaryRouteUrl"]),
      this.readString(family, ["primaryAssertionType"]),
    ]) {
      if (line) failureMessages.push(line);
    }

    for (const g of groups) {
      for (const line of [
        this.readString(g, ["message", "errorMessage", "failureMessage"]),
        this.readString(g, ["title"]),
        this.readString(g, ["shortMessage"]),
        this.readString(g, ["fullMessage"]),
      ]) {
        if (line) failureMessages.push(line);
      }
    }

    const stackTraces = groups
      .map((g) => this.readString(g, ["stack", "stackTrace", "errorStack", "fullMessage"]))
      .filter((value): value is string => Boolean(value));

    const artifactTexts = groups.flatMap((g) =>
      this.readArtifactTexts({
        artifacts: g.evidenceSummaryJson,
        artifactRefs: g.artifactRefsJson,
        evidence: g.diagnosticPreviewJson,
        richEvidence: g.richEvidenceJson,
        debug: g.testTitlesJson,
      }),
    );

    const filePaths = groups
      .map((g) => this.readString(g, ["file", "filePath", "specFile"]))
      .filter((value): value is string => Boolean(value));

    const diagnosis = this.systemTestsDiagnosisService.diagnose({
      familyId: family.id,
      title: family.displayTitle ?? family.familyKey ?? family.id,
      fingerprint: family.familyKey,
      failureMessages,
      stackTraces,
      filePaths,
      artifactTexts,
    });

    const recommendations = this.systemTestsFixService.buildRecommendations(diagnosis);

    return {
      diagnosis: {
        familyId: diagnosis.familyId,
        category: diagnosis.category,
        rootCause: diagnosis.rootCause,
        confidence: diagnosis.confidence,
        summary: diagnosis.summary,
        signals: diagnosis.signals.map((signal) => ({
          code: signal.code,
          label: signal.label,
          matchedText: signal.matchedText ?? null,
        })),
      },
      recommendations: recommendations.map((recommendation) => ({
        familyId: recommendation.familyId,
        title: recommendation.title,
        explanation: recommendation.explanation,
        cursorReady: recommendation.cursorReady,
        actions: recommendation.actions.map((action) => ({
          type: action.type,
          file: action.file,
          instruction: action.instruction,
          reason: action.reason,
        })),
      })),
    };
  }

  private readString(value: unknown, candidateKeys: string[]): string | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    for (const key of candidateKeys) {
      const found = (value as Record<string, unknown>)[key];
      if (typeof found === "string" && found.trim().length > 0) {
        return found.trim();
      }
    }

    return null;
  }

  private readArtifactTexts(value: unknown): string[] {
    if (!value || typeof value !== "object") {
      return [];
    }

    const keys = ["artifacts", "artifactRefs", "evidence", "richEvidence", "debug"];
    const results: string[] = [];

    for (const key of keys) {
      const found = (value as Record<string, unknown>)[key];
      this.collectStrings(found, results);
    }

    return results;
  }

  private collectStrings(value: unknown, results: string[]): void {
    if (!value) {
      return;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        results.push(trimmed);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.collectStrings(item, results);
      }
      return;
    }

    if (typeof value === "object") {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        this.collectStrings(nested, results);
      }
    }
  }
}
