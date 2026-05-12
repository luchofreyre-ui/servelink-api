import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { ANALYTICS_AGGREGATE_WINDOW } from "./operational-analytics.constants";
import {
  OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY,
  OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
  OPERATIONAL_REPLAY_DIFF_CATEGORY,
  REPLAY_INTERPRETATION_CATEGORY,
} from "./operational-replay-analysis.constants";
import {
  OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION,
  OPERATIONAL_REPLAY_PAIRING_CATEGORY,
} from "./operational-replay-intelligence-suite.constants";
import { buildReplayArchivePairAnalysis } from "./operational-replay-diff-compute";
import { OPERATIONAL_REPLAY_ENGINE_VERSION } from "./operational-replay.constants";

function archiveBatchIso(payload: unknown): string | null {
  const root =
    payload && typeof payload === "object" && !Array.isArray(payload) ?
      (payload as Record<string, unknown>)
    : {};
  const iso = root.batchCreatedAtIso;
  return typeof iso === "string" ? iso : null;
}

@Injectable()
export class OperationalReplayIntelligenceSuiteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist an explicitly ordered replay comparison (admin-initiated only).
   * Reorders sessions deterministically by archived batch ISO when callers submit arbitrary ids.
   */
  async persistExplicitReplayComparison(params: {
    aggregateWindow: string;
    olderReplaySessionId: string;
    newerReplaySessionId: string;
    comparisonIssuedAt?: Date;
  }): Promise<{
    operationalReplayDiffId: string;
    reused: boolean;
  }> {
    const windowKey =
      params.aggregateWindow?.trim() || ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;
    const issuedAt = params.comparisonIssuedAt ?? new Date();
    const rawA = params.olderReplaySessionId?.trim();
    const rawB = params.newerReplaySessionId?.trim();
    if (!rawA || !rawB) {
      throw new BadRequestException(
        "Both olderReplaySessionId and newerReplaySessionId are required.",
      );
    }
    if (rawA === rawB) {
      throw new BadRequestException("Distinct replay sessions are required.");
    }

    const [sA, sB] = await Promise.all([
      this.prisma.operationalReplaySession.findUnique({
        where: { id: rawA },
        include: { graphHistory: { select: { payloadJson: true } } },
      }),
      this.prisma.operationalReplaySession.findUnique({
        where: { id: rawB },
        include: { graphHistory: { select: { payloadJson: true } } },
      }),
    ]);

    if (!sA || !sB) {
      throw new BadRequestException(
        "One or both replay sessions were not found.",
      );
    }

    if (
      sA.replayEngineVersion !== OPERATIONAL_REPLAY_ENGINE_VERSION ||
      sB.replayEngineVersion !== OPERATIONAL_REPLAY_ENGINE_VERSION
    ) {
      throw new BadRequestException(
        "Replay engine version mismatch — suite comparisons target Phase 32 replay sessions only.",
      );
    }

    if (sA.aggregateWindow !== windowKey || sB.aggregateWindow !== windowKey) {
      throw new BadRequestException(
        "Aggregate window mismatch across selected replay sessions.",
      );
    }

    if (!sA.graphHistory?.payloadJson || !sB.graphHistory?.payloadJson) {
      throw new BadRequestException(
        "Replay sessions must reference materialized graph history archives.",
      );
    }

    const isoA = archiveBatchIso(sA.graphHistory.payloadJson);
    const isoB = archiveBatchIso(sB.graphHistory.payloadJson);
    const tieA = sA.createdAt.getTime();
    const tieB = sB.createdAt.getTime();

    let olderSession = sA;
    let newerSession = sB;

    if (isoA && isoB) {
      const cmp = isoA.localeCompare(isoB);
      if (cmp > 0) {
        olderSession = sB;
        newerSession = sA;
      } else if (cmp === 0 && tieA > tieB) {
        olderSession = sB;
        newerSession = sA;
      }
    } else if (tieA > tieB) {
      olderSession = sB;
      newerSession = sA;
    }

    const olderPayload = olderSession.graphHistory!.payloadJson;
    const newerPayload = newerSession.graphHistory!.payloadJson;

    const analysis = buildReplayArchivePairAnalysis({
      olderArchivePayload: olderPayload,
      newerArchivePayload: newerPayload,
      aggregateWindow: windowKey,
      olderBatchCreatedAtIso: archiveBatchIso(olderPayload),
      newerBatchCreatedAtIso: archiveBatchIso(newerPayload),
      diffCategory:
        OPERATIONAL_REPLAY_DIFF_CATEGORY.EXPLICIT_ADMIN_SELECTED_PAIR_V1,
    });

    const existing = await this.prisma.operationalReplayDiff.findUnique({
      where: {
        sourceReplaySessionId_comparisonReplaySessionId_diffCategory: {
          sourceReplaySessionId: olderSession.id,
          comparisonReplaySessionId: newerSession.id,
          diffCategory:
            OPERATIONAL_REPLAY_DIFF_CATEGORY.EXPLICIT_ADMIN_SELECTED_PAIR_V1,
        },
      },
    });

    if (existing) {
      return {
        operationalReplayDiffId: existing.id,
        reused: true,
      };
    }

    const operationalReplayDiffId = await this.prisma.$transaction(
      async (tx) => {
        const diffRow = await tx.operationalReplayDiff.create({
          data: {
            replayAnalysisEngineVersion:
              OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
            aggregateWindow: windowKey,
            diffCategory:
              OPERATIONAL_REPLAY_DIFF_CATEGORY.EXPLICIT_ADMIN_SELECTED_PAIR_V1,
            sourceReplaySessionId: olderSession.id,
            comparisonReplaySessionId: newerSession.id,
            payloadJson: analysis.diffPayload,
            createdAt: issuedAt,
          },
        });

        await tx.operationalChronologyDelta.create({
          data: {
            replayAnalysisEngineVersion:
              OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
            aggregateWindow: windowKey,
            operationalReplayDiffId: diffRow.id,
            deltaCategory:
              OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY
                .AGGREGATED_SEQUENCE_COMPARISON_V1,
            payloadJson: analysis.chronologyDeltaPayload,
            createdAt: issuedAt,
          },
        });

        await tx.replayInterpretationSnapshot.create({
          data: {
            replayAnalysisEngineVersion:
              OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION,
            aggregateWindow: windowKey,
            operationalReplayDiffId: diffRow.id,
            interpretationCategory:
              REPLAY_INTERPRETATION_CATEGORY
                .DETERMINISTIC_TEMPLATE_NARRATIVE_V1,
            payloadJson: analysis.interpretationPayload,
            createdAt: issuedAt,
          },
        });

        await tx.operationalReplayPairing.create({
          data: {
            replaySuiteEngineVersion:
              OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION,
            aggregateWindow: windowKey,
            pairingCategory:
              OPERATIONAL_REPLAY_PAIRING_CATEGORY.EXPLICIT_ADMIN_SELECTION_V1,
            orderedOlderReplaySessionId: olderSession.id,
            orderedNewerReplaySessionId: newerSession.id,
            operationalReplayDiffId: diffRow.id,
            payloadJson: {
              ...(analysis.pairingObservationPayload as Record<
                string,
                unknown
              >),
              orderedOlderReplaySessionId: olderSession.id,
              orderedNewerReplaySessionId: newerSession.id,
              explicitAdminReplayComparisonRequestV1: true,
            },
            createdAt: issuedAt,
          },
        });

        await tx.operationalChronologySemanticAlignment.create({
          data: {
            replaySuiteEngineVersion:
              OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION,
            aggregateWindow: windowKey,
            operationalReplayDiffId: diffRow.id,
            payloadJson: analysis.semanticAlignmentPayload,
            createdAt: issuedAt,
          },
        });

        return diffRow.id;
      },
    );

    return { operationalReplayDiffId, reused: false };
  }
}
