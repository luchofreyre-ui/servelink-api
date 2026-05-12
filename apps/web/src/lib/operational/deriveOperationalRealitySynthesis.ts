import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";

export type OperationalRealityPillar = {
  id: string;
  title: string;
  lines: string[];
  anchorHref: string;
};

export type OperationalRealitySynthesis = {
  pillars: OperationalRealityPillar[];
  /** Deterministic “why this matters” lines — template-backed, count-derived only. */
  tacticalWhyLines: string[];
  hydrationNote: string | null;
};

/**
 * Cross-domain operational posture synthesis — disclosed dashboard fields only.
 * No scoring, prioritization, or inferred causal conclusions.
 */
export function buildOperationalRealitySynthesis(
  dash: AdminOperationalIntelligenceDashboard | null,
): OperationalRealitySynthesis {
  if (!dash) {
    return {
      pillars: [],
      tacticalWhyLines: [],
      hydrationNote:
        "Operational intelligence is still loading or unavailable — hydrate via the coordinated dashboard fetch and use Refresh warehouse snapshots when persisted sections stay empty.",
    };
  }

  const persisted = dash.persisted;
  const pf = dash.live.portfolio;
  const histories = dash.persistedOperationalReplayTimeline.histories ?? [];
  const graph = dash.persistedOperationalEntityGraph;
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const incidents = dash.persistedOperationalIncidentCommand.incidents ?? [];
  const drift = dash.persistedVsLiveDrift ?? [];
  const science = dash.persistedOperationalScience;
  const validity = dash.persistedOperationalInterventionValidity;
  const experimentation = dash.persistedOperationalExperimentation;
  const balancing = dash.persistedBalancing;

  const pillars: OperationalRealityPillar[] = [
    {
      id: "pillar_live_orchestration",
      title: "Live orchestration posture",
      lines: [
        `Waiting approval workflows (portfolio signal): ${pf.workflowsWaitingApproval}.`,
        `Governance-blocked executions: ${pf.workflowsGovernanceBlocked}.`,
        `Pending approvals: ${pf.pendingApprovals}; open escalations: ${dash.live.escalationDensity.open}.`,
      ],
      anchorHref: "#admin-portfolio-orchestration-strip",
    },
    {
      id: "pillar_warehouse_timing",
      title: "Warehouse snapshot timing",
      lines: [
        `Aggregate window: ${persisted.aggregateWindow}.`,
        `Metric snapshots refreshed at: ${persisted.refreshedAt ?? "—"}.`,
        `Balancing rows refreshed at: ${balancing.refreshedAt ?? "—"}.`,
      ],
      anchorHref: "#operational-intelligence-coordinated-strip",
    },
    {
      id: "pillar_replay",
      title: "Replay archive continuity",
      lines: [
        `Archived replay histories linked to this dashboard: ${histories.length}.`,
        `Replay timeline strip refreshed at: ${dash.persistedOperationalReplayTimeline.refreshedAt ?? "—"}.`,
        `Replay analysis diffs available: ${dash.persistedOperationalReplayAnalysis.diffs.length}.`,
      ],
      anchorHref: "#operational-replay-timeline-strip",
    },
    {
      id: "pillar_graph",
      title: "Graph-native linkage archive",
      lines: [
        `Persisted nodes: ${nodes.length}; edges: ${edges.length}.`,
        `Graph material refreshed at: ${graph.refreshedAt ?? "—"}.`,
      ],
      anchorHref: "#operational-graph-relationship-rail",
    },
    {
      id: "pillar_science_validity",
      title: "Operational science & intervention validity samples",
      lines: [
        `Science cohort snapshots: ${science.cohortSnapshots.length}.`,
        `Validity assignments / certifications: ${validity.interventionAssignments.length} / ${validity.validityCertifications.length}.`,
        `Experiment snapshots (benchmark surface): ${experimentation.experimentSnapshots.length}.`,
      ],
      anchorHref: "#operational-intervention-replay-coordination-rail",
    },
  ];

  const tacticalWhyLines: string[] = [];

  if (pf.workflowsGovernanceBlocked > 0 || pf.overdueWorkflowTimers > 0) {
    tacticalWhyLines.push(
      "Governance-blocked or overdue-timer workflows are disclosed live — operators reconcile meaning through portfolio and approval rails without autonomous execution.",
    );
  }

  if (histories.length >= 2) {
    tacticalWhyLines.push(
      "Several archived batches are present — replay explorer and analysis strips support deterministic comparison; chronological spacing is ISO-derived, not causal inference.",
    );
  }

  if (drift.length > 0) {
    tacticalWhyLines.push(
      `Persisted-vs-live drift exposes measurement separation (${drift.length} disclosed metric pairs) — interpret with warehouse refresh semantics only.`,
    );
  }

  if (edges.length > 0 && nodes.length > 0) {
    tacticalWhyLines.push(
      "Entity graph archives connect warehouse anchors to incidents and workflows — use explorer and topology together for continuity, not automated graph reasoning.",
    );
  }

  if (incidents.length > 0) {
    tacticalWhyLines.push(
      `Coordination incidents (${incidents.length}) are surfaced for explicit drilldown navigation — they do not trigger autonomous remediation.`,
    );
  }

  if (
    !persisted.refreshedAt &&
    histories.length === 0 &&
    nodes.length === 0 &&
    science.cohortSnapshots.length === 0
  ) {
    tacticalWhyLines.push(
      "Most persisted cohorts are empty — run Refresh warehouse snapshots from operational intelligence when migrations and workers have populated analytics rows.",
    );
  }

  return {
    pillars,
    tacticalWhyLines: tacticalWhyLines.slice(0, 6),
    hydrationNote: null,
  };
}
