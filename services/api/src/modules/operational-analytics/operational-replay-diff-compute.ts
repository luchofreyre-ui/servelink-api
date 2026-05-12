import type { Prisma } from "@prisma/client";
import { OPERATIONAL_ENTITY_CATEGORY } from "./operational-entity-graph.constants";
import {
  OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY,
  OPERATIONAL_REPLAY_DIFF_CATEGORY,
  REPLAY_INTERPRETATION_CATEGORY,
} from "./operational-replay-analysis.constants";
import { OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION } from "./operational-replay-intelligence-suite.constants";

const ANALYSIS_GOVERNANCE_PAYLOAD = {
  noAutonomousOperationalResolution: true,
  noAiExecutionAuthority: true,
  observeCompareInterpretOnly: true,
  noHiddenOperationalScoring: true,
  noAutonomousReplayAnalysisActions: true,
  deterministicReplayDiffSemantics: true,
} satisfies Prisma.InputJsonObject;

function suiteObservationEnvelope(): Prisma.InputJsonObject {
  return {
    replayIntelligenceSuiteEngineVersion:
      OPERATIONAL_REPLAY_INTELLIGENCE_SUITE_ENGINE_VERSION,
    deterministicOperationalReplaySuiteObservationOnly: true,
    replayTopologyInterpretationExplainableOnly: true,
    semanticChronologyAlignmentNoCausalClaims: true,
  } satisfies Prisma.InputJsonObject;
}

function parseNodeSnapshots(
  archiveRoot: Record<string, unknown>,
): Array<{ entityCategory: string; payloadJson?: unknown }> {
  const raw = archiveRoot.nodeSnapshots;
  if (!Array.isArray(raw)) return [];
  const out: Array<{ entityCategory: string; payloadJson?: unknown }> = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const ec = rec.entityCategory;
    if (typeof ec !== "string" || !ec.trim()) continue;
    out.push({ entityCategory: ec, payloadJson: rec.payloadJson });
  }
  return out;
}

function parseEdgeSnapshots(
  archiveRoot: Record<string, unknown>,
): unknown[] {
  const raw = archiveRoot.edgeSnapshots;
  return Array.isArray(raw) ? raw : [];
}

function parseIncidentIds(
  archiveRoot: Record<string, unknown>,
): string[] {
  const raw = archiveRoot.incidentDigest;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as Record<string, unknown>).operationalIncidentId;
    if (typeof id === "string" && id.trim()) ids.push(id);
  }
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

function parseChronologyPairs(
  archiveRoot: Record<string, unknown>,
): Array<{ sequenceIndex: number; chronologyCategory: string }> {
  const raw = archiveRoot.chronologySnapshots;
  if (!Array.isArray(raw)) return [];
  const pairs: Array<{ sequenceIndex: number; chronologyCategory: string }> =
    [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const cat =
      typeof rec.chronologyCategory === "string" ?
        rec.chronologyCategory
      : "";
    const pj = rec.payloadJson;
    let seq = 0;
    if (pj && typeof pj === "object" && !Array.isArray(pj)) {
      const s = (pj as Record<string, unknown>).sequenceIndex;
      if (typeof s === "number" && Number.isFinite(s)) seq = s;
    }
    pairs.push({ sequenceIndex: seq, chronologyCategory: cat });
  }
  pairs.sort((a, b) =>
    a.sequenceIndex !== b.sequenceIndex ?
      a.sequenceIndex - b.sequenceIndex
    : a.chronologyCategory.localeCompare(b.chronologyCategory),
  );
  return pairs;
}

function histogramEntityCategories(
  nodes: Array<{ entityCategory: string }>,
): Record<string, number> {
  const h: Record<string, number> = {};
  for (const n of nodes) {
    h[n.entityCategory] = (h[n.entityCategory] ?? 0) + 1;
  }
  return h;
}

function histogramEdgeCategories(edges: unknown[]): Record<string, number> {
  const h: Record<string, number> = {};
  for (const row of edges) {
    if (!row || typeof row !== "object") continue;
    const ec = (row as Record<string, unknown>).edgeCategory;
    if (typeof ec !== "string" || !ec.trim()) continue;
    h[ec] = (h[ec] ?? 0) + 1;
  }
  return h;
}

function lcsLength(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0),
  );
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[n][m];
}

function multisetCount(seq: string[]): Record<string, number> {
  const h: Record<string, number> = {};
  for (const c of seq) {
    const key = c.trim() || "__empty_chronology_category__";
    h[key] = (h[key] ?? 0) + 1;
  }
  return h;
}

function multisetRowsFromSequences(
  olderCats: string[],
  newerCats: string[],
): Array<{ chronologyCategory: string; olderCount: number; newerCount: number; multisetDelta: number }> {
  const ho = multisetCount(olderCats);
  const hn = multisetCount(newerCats);
  const cats = [...new Set([...Object.keys(ho), ...Object.keys(hn)])].sort((x, y) =>
    x.localeCompare(y),
  );

  return cats.map((chronologyCategory) => ({
    chronologyCategory,
    olderCount: ho[chronologyCategory] ?? 0,
    newerCount: hn[chronologyCategory] ?? 0,
    multisetDelta:
      (hn[chronologyCategory] ?? 0) - (ho[chronologyCategory] ?? 0),
  }));
}

function postureObservation(nodes: Array<{ entityCategory: string }>) {
  const h = histogramEntityCategories(nodes);
  return {
    orchestrationPosture: h[OPERATIONAL_ENTITY_CATEGORY.ORCHESTRATION_POSTURE_V1] ?? 0,
    approvalEscalationSurface:
      h[OPERATIONAL_ENTITY_CATEGORY.APPROVAL_ESCALATION_SURFACE_V1] ?? 0,
    interventionValidityObservation:
      h[OPERATIONAL_ENTITY_CATEGORY.INTERVENTION_VALIDITY_OBSERVATION_V1] ??
      0,
  };
}

function densityRational(nodeTotal: number, edgeTotal: number) {
  const denom = Math.max(nodeTotal * Math.max(nodeTotal - 1, 0), 1);
  return { numerator: edgeTotal, denominator: denom };
}

function histogramSortedRows(hist: Record<string, number>) {
  return Object.keys(hist)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => ({ key: k, count: hist[k] ?? 0 }));
}

/** Deterministic replay-linked observation extracted from an archived warehouse graph snapshot. */
export function buildTopologySnapshotPayload(
  archivePayload: unknown,
): Prisma.InputJsonObject {
  const root =
    archivePayload &&
    typeof archivePayload === "object" &&
    !Array.isArray(archivePayload) ?
      (archivePayload as Record<string, unknown>)
    : {};
  const nodes = parseNodeSnapshots(root);
  const edges = parseEdgeSnapshots(root);
  const incidents = parseIncidentIds(root);
  const nodeHist = histogramEntityCategories(nodes);
  const edgeHist = histogramEdgeCategories(edges);
  const nodeTotal = nodes.length;
  const edgeTotal = edges.length;

  return {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    explainabilityRef: "operational_topology_snapshot_v1",
    nodeTotal,
    edgeTotal,
    directedGraphDensityRational: densityRational(nodeTotal, edgeTotal),
    entityCategoryHistogramRows:
      histogramSortedRows(nodeHist) as unknown as Prisma.InputJsonValue,
    edgeCategoryHistogramRows:
      histogramSortedRows(edgeHist) as unknown as Prisma.InputJsonValue,
    incidentDigestCardinality: incidents.length,
    postureObservation:
      postureObservation(nodes) as unknown as Prisma.InputJsonValue,
  };
}

function observationTotalsFromValidityPayload(payload: unknown): {
  interventionAssignmentsObserved: number | null;
  validityCertificationsObserved: number | null;
  controlCohortSnapshotsObserved: number | null;
} {
  if (!payload || typeof payload !== "object") {
    return {
      interventionAssignmentsObserved: null,
      validityCertificationsObserved: null,
      controlCohortSnapshotsObserved: null,
    };
  }
  const rec = payload as Record<string, unknown>;
  const ia = rec.interventionAssignmentsObserved;
  const vc = rec.validityCertificationsObserved;
  const cc = rec.controlCohortSnapshotsObserved;
  return {
    interventionAssignmentsObserved:
      typeof ia === "number" && Number.isFinite(ia) ? ia : null,
    validityCertificationsObserved:
      typeof vc === "number" && Number.isFinite(vc) ? vc : null,
    controlCohortSnapshotsObserved:
      typeof cc === "number" && Number.isFinite(cc) ? cc : null,
  };
}

/** Replay bridge tying archived posture snapshots to intervention validity observation disclosure rows only (counts). */
export function buildInterventionObservationReplayBridgePayload(
  archivePayload: unknown,
): Prisma.InputJsonObject {
  const root =
    archivePayload &&
    typeof archivePayload === "object" &&
    !Array.isArray(archivePayload) ?
      (archivePayload as Record<string, unknown>)
    : {};
  const nodes = parseNodeSnapshots(root);
  const ivNodes = nodes.filter(
    (n) =>
      n.entityCategory ===
      OPERATIONAL_ENTITY_CATEGORY.INTERVENTION_VALIDITY_OBSERVATION_V1,
  );
  let aggAssignments = 0;
  let aggCerts = 0;
  let aggControls = 0;
  let sawObservationPayload = false;
  for (const row of ivNodes) {
    const o = observationTotalsFromValidityPayload(row.payloadJson);
    if (
      o.interventionAssignmentsObserved !== null ||
      o.validityCertificationsObserved !== null ||
      o.controlCohortSnapshotsObserved !== null
    ) {
      sawObservationPayload = true;
    }
    if (typeof o.interventionAssignmentsObserved === "number") {
      aggAssignments += o.interventionAssignmentsObserved;
    }
    if (typeof o.validityCertificationsObserved === "number") {
      aggCerts += o.validityCertificationsObserved;
    }
    if (typeof o.controlCohortSnapshotsObserved === "number") {
      aggControls += o.controlCohortSnapshotsObserved;
    }
  }
  return {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    explainabilityRef: "replay_intervention_observation_bridge_v1",
    interventionValidityObservationNodeCardinality: ivNodes.length,
    summedInterventionAssignmentsObserved:
      sawObservationPayload ? aggAssignments : null,
    summedValidityCertificationsObserved:
      sawObservationPayload ? aggCerts : null,
    summedControlCohortSnapshotsObserved:
      sawObservationPayload ? aggControls : null,
    aggregationSemantics:
      "summed_counts_across_disclosed_validity_observation_nodes_v1",
  };
}

export type ReplayArchivePairAnalysisResult = {
  diffPayload: Prisma.InputJsonObject;
  chronologyDeltaPayload: Prisma.InputJsonObject;
  interpretationPayload: Prisma.InputJsonObject;
  semanticAlignmentPayload: Prisma.InputJsonObject;
  pairingObservationPayload: Prisma.InputJsonObject;
};

export type ConsecutiveBatchReplayAnalysisResult = ReplayArchivePairAnalysisResult;

/** Deterministic diff between two archived graph payloads (ordered older → newer archive semantics). */
export function buildReplayArchivePairAnalysis(params: {
  olderArchivePayload: unknown;
  newerArchivePayload: unknown;
  aggregateWindow: string;
  olderBatchCreatedAtIso: string | null;
  newerBatchCreatedAtIso: string | null;
  diffCategory:
    | typeof OPERATIONAL_REPLAY_DIFF_CATEGORY.CONSECUTIVE_WAREHOUSE_BATCH_V1
    | typeof OPERATIONAL_REPLAY_DIFF_CATEGORY.EXPLICIT_ADMIN_SELECTED_PAIR_V1;
}): ReplayArchivePairAnalysisResult {
  const olderRoot =
    params.olderArchivePayload &&
    typeof params.olderArchivePayload === "object" &&
    !Array.isArray(params.olderArchivePayload) ?
      (params.olderArchivePayload as Record<string, unknown>)
    : {};
  const newerRoot =
    params.newerArchivePayload &&
    typeof params.newerArchivePayload === "object" &&
    !Array.isArray(params.newerArchivePayload) ?
      (params.newerArchivePayload as Record<string, unknown>)
    : {};

  const olderNodes = parseNodeSnapshots(olderRoot);
  const newerNodes = parseNodeSnapshots(newerRoot);
  const olderEdges = parseEdgeSnapshots(olderRoot);
  const newerEdges = parseEdgeSnapshots(newerRoot);
  const olderIncidents = parseIncidentIds(olderRoot);
  const newerIncidents = parseIncidentIds(newerRoot);
  const olderChrono = parseChronologyPairs(olderRoot);
  const newerChrono = parseChronologyPairs(newerRoot);

  const olderChronoCats = olderChrono.map((r) => r.chronologyCategory);
  const newerChronoCats = newerChrono.map((r) => r.chronologyCategory);

  const nodeHistOld = histogramEntityCategories(olderNodes);
  const nodeHistNew = histogramEntityCategories(newerNodes);
  const edgeHistOld = histogramEdgeCategories(olderEdges);
  const edgeHistNew = histogramEdgeCategories(newerEdges);

  const categories = [
    ...new Set([
      ...Object.keys(nodeHistOld),
      ...Object.keys(nodeHistNew),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const entityCategoryHistogramDelta = categories.map((cat) => ({
    entityCategory: cat,
    olderCount: nodeHistOld[cat] ?? 0,
    newerCount: nodeHistNew[cat] ?? 0,
    delta: (nodeHistNew[cat] ?? 0) - (nodeHistOld[cat] ?? 0),
  }));

  const edgeCats = [
    ...new Set([
      ...Object.keys(edgeHistOld),
      ...Object.keys(edgeHistNew),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const edgeCategoryHistogramDelta = edgeCats.map((cat) => ({
    edgeCategory: cat,
    olderCount: edgeHistOld[cat] ?? 0,
    newerCount: edgeHistNew[cat] ?? 0,
    delta: (edgeHistNew[cat] ?? 0) - (edgeHistOld[cat] ?? 0),
  }));

  const olderIncSet = new Set(olderIncidents);
  const newerIncSet = new Set(newerIncidents);
  const incidentsAdded = newerIncidents.filter((id) => !olderIncSet.has(id));
  const incidentsRemoved = olderIncidents.filter(
    (id) => !newerIncSet.has(id),
  );

  const maxChronoLen = Math.max(olderChrono.length, newerChrono.length);
  const sequenceComparisons: Array<{
    sequenceIndex: number;
    olderChronologyCategory: string | null;
    newerChronologyCategory: string | null;
    categoryChanged: boolean;
  }> = [];

  for (let i = 0; i < maxChronoLen; i += 1) {
    const o = olderChrono[i];
    const n = newerChrono[i];
    const si =
      o?.sequenceIndex ??
      n?.sequenceIndex ??
      i;
    const oc = o?.chronologyCategory ?? null;
    const nc = n?.chronologyCategory ?? null;
    sequenceComparisons.push({
      sequenceIndex: si,
      olderChronologyCategory: oc,
      newerChronologyCategory: nc,
      categoryChanged: oc !== nc,
    });
  }

  const chronologySlotsChanged = sequenceComparisons.filter(
    (r) => r.categoryChanged,
  ).length;

  const lcs = lcsLength(olderChronoCats, newerChronoCats);
  const denomLen = Math.max(olderChronoCats.length, newerChronoCats.length, 1);
  const sequenceSimilarityRatio = lcs / denomLen;

  const multisetRows = multisetRowsFromSequences(
    olderChronoCats,
    newerChronoCats,
  );
  const multisetNonZero = multisetRows.filter((r) => r.multisetDelta !== 0);

  const postureOld = postureObservation(olderNodes);
  const postureNew = postureObservation(newerNodes);

  const topologyComparisonSummary = {
    explainabilityRef: "replay_topology_comparison_summary_v1",
    nodeCountDelta: newerNodes.length - olderNodes.length,
    edgeCountDelta: newerEdges.length - olderEdges.length,
    incidentCardinalityDelta:
      newerIncidents.length - olderIncidents.length,
    postureOrchestrationDelta:
      postureNew.orchestrationPosture - postureOld.orchestrationPosture,
    postureApprovalEscalationDelta:
      postureNew.approvalEscalationSurface -
      postureOld.approvalEscalationSurface,
    postureInterventionValidityDelta:
      postureNew.interventionValidityObservation -
      postureOld.interventionValidityObservation,
    entityHistogramUnionSortedDeltaSample:
      entityCategoryHistogramDelta
        .filter((row) => row.delta !== 0)
        .sort((a, b) => {
          const ad = Math.abs(a.delta);
          const bd = Math.abs(b.delta);
          if (ad !== bd) return bd - ad;
          return a.entityCategory.localeCompare(b.entityCategory);
        })
        .slice(0, 8) as unknown as Prisma.InputJsonValue,
  };

  const explainabilityRefDiff =
    params.diffCategory ===
    OPERATIONAL_REPLAY_DIFF_CATEGORY.EXPLICIT_ADMIN_SELECTED_PAIR_V1 ?
      "explicit_admin_selected_pair_graph_diff_v1"
    : "consecutive_warehouse_batch_graph_diff_v1";

  const diffPayload: Prisma.InputJsonObject = {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    explainabilityRef: explainabilityRefDiff,
    diffCategory: params.diffCategory,
    aggregateWindow: params.aggregateWindow,
    olderBatchCreatedAtIso: params.olderBatchCreatedAtIso,
    newerBatchCreatedAtIso: params.newerBatchCreatedAtIso,
    nodeCountDelta: newerNodes.length - olderNodes.length,
    edgeCountDelta: newerEdges.length - olderEdges.length,
    entityCategoryHistogramDelta:
      entityCategoryHistogramDelta as unknown as Prisma.InputJsonValue,
    edgeCategoryHistogramDelta:
      edgeCategoryHistogramDelta as unknown as Prisma.InputJsonValue,
    incidentsAddedIds:
      incidentsAdded as unknown as Prisma.InputJsonValue,
    incidentsRemovedIds:
      incidentsRemoved as unknown as Prisma.InputJsonValue,
    chronologySlotsCompared: sequenceComparisons.length,
    chronologySlotsWithCategoryChange: chronologySlotsChanged,
    topologyComparisonSummary:
      topologyComparisonSummary as unknown as Prisma.InputJsonValue,
  };

  const chronologyDeltaPayload: Prisma.InputJsonObject = {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    deltaCategory:
      OPERATIONAL_CHRONOLOGY_DELTA_CATEGORY.AGGREGATED_SEQUENCE_COMPARISON_V1,
    explainabilityRef: "aggregated_chronology_sequence_comparison_v1",
    sequenceComparisons:
      sequenceComparisons as unknown as Prisma.InputJsonValue,
  };

  const driftInterpretationLines = [
    "Semantic chronology alignment — multiset category continuity tables plus longest-common-subsequence length on ordered chronology categories only; does not assert causality.",
    `Multiset chronology categories with non-zero count delta = ${multisetNonZero.length}.`,
    `Ordered chronology category sequence LCS length = ${lcs} (older length ${olderChronoCats.length}, newer length ${newerChronoCats.length}); similarity ratio LCS ÷ max(length) = ${sequenceSimilarityRatio.toFixed(6)}.`,
    `Topology posture deltas — orchestration observation nodes Δ ${topologyComparisonSummary.postureOrchestrationDelta}; approval / escalation surface observation nodes Δ ${topologyComparisonSummary.postureApprovalEscalationDelta}; intervention validity disclosure observation nodes Δ ${topologyComparisonSummary.postureInterventionValidityDelta}.`,
  ];

  const semanticAlignmentPayload: Prisma.InputJsonObject = {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    explainabilityRef: "semantic_chronology_alignment_v1",
    chronologyCategoryMultisetRows:
      multisetRows as unknown as Prisma.InputJsonValue,
    chronologyOrderedCategorySequences: {
      older: olderChronoCats,
      newer: newerChronoCats,
    } as unknown as Prisma.InputJsonValue,
    chronologySequenceLcsLength: lcs,
    chronologySequenceSimilarityRatio: sequenceSimilarityRatio,
    driftInterpretationLines:
      driftInterpretationLines as unknown as Prisma.InputJsonValue,
  };

  const pairingObservationPayload: Prisma.InputJsonObject = {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    explainabilityRef: "replay_pairing_lineage_observation_v1",
    orderedOlderBatchCreatedAtIso: params.olderBatchCreatedAtIso,
    orderedNewerBatchCreatedAtIso: params.newerBatchCreatedAtIso,
    pairingSemanticOrderingRule:
      "ordered_by_archive_batch_created_at_iso_then_sequence_fallback_v1",
  };

  const preamble = [
    "Deterministic replay comparison — template narrative only; no scoring or autonomous conclusions.",
    `Aggregate window ${params.aggregateWindow}: newer batch node count minus older = ${newerNodes.length - olderNodes.length}.`,
    `Edge snapshot count delta = ${newerEdges.length - olderEdges.length}.`,
    `Incident coordination ids added = ${incidentsAdded.length}; removed = ${incidentsRemoved.length}.`,
    `Chronology sequence slots compared = ${sequenceComparisons.length}; categories differ in ${chronologySlotsChanged} slot(s).`,
  ];

  const deltaLines = entityCategoryHistogramDelta
    .filter((row) => row.delta !== 0)
    .map(
      (row) =>
        `Entity category ${row.entityCategory}: count delta ${row.delta} (older ${row.olderCount} → newer ${row.newerCount}).`,
    )
    .sort((a, b) => a.localeCompare(b));

  const narrativeLines = [...preamble, ...deltaLines, ...driftInterpretationLines];

  const interpretationPayload: Prisma.InputJsonObject = {
    ...ANALYSIS_GOVERNANCE_PAYLOAD,
    ...suiteObservationEnvelope(),
    interpretationCategory:
      REPLAY_INTERPRETATION_CATEGORY.DETERMINISTIC_TEMPLATE_NARRATIVE_V1,
    explainabilityRef: "deterministic_template_replay_interpretation_v1",
    narrativeLines:
      narrativeLines as unknown as Prisma.InputJsonValue,
  };

  return {
    diffPayload,
    chronologyDeltaPayload,
    interpretationPayload,
    semanticAlignmentPayload,
    pairingObservationPayload,
  };
}

export function buildConsecutiveBatchReplayAnalysis(params: {
  olderArchivePayload: unknown;
  newerArchivePayload: unknown;
  aggregateWindow: string;
  olderBatchCreatedAtIso: string | null;
  newerBatchCreatedAtIso: string | null;
}): ConsecutiveBatchReplayAnalysisResult {
  return buildReplayArchivePairAnalysis({
    ...params,
    diffCategory:
      OPERATIONAL_REPLAY_DIFF_CATEGORY.CONSECUTIVE_WAREHOUSE_BATCH_V1,
  });
}
